"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { conversationHistoryAction, markConversationReadAction } from "@/lib/api/chat/action";
import { CHAT_SOCKET_EVENTS as EVENTS } from "@/lib/api/chat/constants";
import type { ChatAgent, ChatMessage, ChatMessageStatus, Conversation, ConversationHistoryEntry, InboxView } from "@/lib/api/chat/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatThread } from "./ChatThread";
import { CustomerPanel } from "./CustomerPanel";
import { ConversationList, inboxHref } from "./ConversationList";
import { useChatSocket } from "./useChatSocket";
import { cn } from "@/lib/utils";

type Agent = { id: string; name: string };

/** Another agent's "typing" lapses after this long without a fresh ping. */
const TYPING_TTL_MS = 6_000;

const RECEIPT_RANK: Record<ChatMessageStatus, number> = { failed: 0, sent: 1, delivered: 2, read: 3 };

function byRecent(a: Conversation, b: Conversation) {
  return (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) - (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0);
}

/** Copies only the fields the event actually carries; `undefined` means "not in this event". */
function patch<T extends object>(target: T, update: Partial<T>): T {
  const next = { ...target };
  for (const [key, value] of Object.entries(update)) if (value !== undefined) (next as Record<string, unknown>)[key] = value;
  return next;
}

function appendMessage(history: ConversationHistoryEntry[], message: ChatMessage) {
  if (history.some((entry) => entry.kind === "message" && entry.id === message.id)) return history;
  return [...history, { kind: "message" as const, ...message }];
}

/**
 * The live inbox. The server page supplies a snapshot (the list for this
 * view, the open thread's history); this keeps it current from the socket and
 * re-reads after a reconnect, since events sent while offline are lost.
 *
 * Switching threads never goes back to the server page: the URL's `?open=` is
 * updated with history.pushState (Next keeps useSearchParams in sync), and each
 * thread's history is cached here, prefetched on hover and revalidated on open.
 */
export function ChatInbox({
  view,
  conversations: initialConversations,
  activeId: serverActiveId,
  history: initialHistory,
  agents,
  meId,
}: {
  view: InboxView;
  conversations: Conversation[];
  activeId?: string;
  history: ConversationHistoryEntry[];
  agents: ChatAgent[];
  meId?: string;
}) {
  const router = useRouter();
  const activeId = useSearchParams().get("open") ?? undefined;
  const [conversations, setConversations] = useState(initialConversations);
  // Conversation id -> its messages and activity, oldest first.
  const [histories, setHistories] = useState<Record<string, ConversationHistoryEntry[]>>(() =>
    serverActiveId ? { [serverActiveId]: initialHistory } : {},
  );
  const [viewers, setViewers] = useState<Record<string, Agent[]>>({});
  const [typing, setTyping] = useState<Record<string, Record<string, Agent & { until: number }>>>({});
  // Bumped when the open thread's activity changes, so the customer panel re-reads.
  const [customerVersion, setCustomerVersion] = useState(0);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);

  // A new server snapshot (navigation or refresh) replaces local state.
  const [seenConversations, setSeenConversations] = useState(initialConversations);
  if (seenConversations !== initialConversations) {
    setSeenConversations(initialConversations);
    setConversations(initialConversations);
  }
  const [seenHistory, setSeenHistory] = useState(initialHistory);
  if (seenHistory !== initialHistory) {
    setSeenHistory(initialHistory);
    if (serverActiveId) setHistories((all) => ({ ...all, [serverActiveId]: initialHistory }));
  }

  const active = conversations.find((conversation) => conversation.id === activeId);
  const history = activeId ? histories[activeId] : undefined;

  /** Applies a change to one cached thread; threads never opened are left alone. */
  const updateHistory = useCallback((id: string, change: (history: ConversationHistoryEntry[]) => ConversationHistoryEntry[]) => {
    setHistories((all) => (all[id] ? { ...all, [id]: change(all[id]) } : all));
  }, []);

  // Handlers run outside render; they read the latest values through refs.
  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    conversationsRef.current = conversations;
    activeIdRef.current = activeId;
  });

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshSoon = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 800);
  }, [router]);

  // Threads seen but not yet marked read on the server. Kept per id so one thread's
  // debounce never cancels another's, and kept while the tab is hidden so the read is
  // sent once the agent is back instead of being dropped.
  const pendingReads = useRef(new Set<string>());
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushReads = useCallback(() => {
    readTimer.current = null;
    if (document.visibilityState !== "visible" || pendingReads.current.size === 0) return;
    const ids = new Set(pendingReads.current);
    pendingReads.current.clear();
    setConversations((list) => list.map((c) => (ids.has(c.id) ? { ...c, unreadCount: 0 } : c)));
    for (const id of ids) void markConversationReadAction({ id });
  }, []);
  const markReadSoon = useCallback(
    (id: string) => {
      pendingReads.current.add(id);
      if (document.visibilityState !== "visible") return;
      if (readTimer.current) clearTimeout(readTimer.current);
      readTimer.current = setTimeout(flushReads, 600);
    },
    [flushReads],
  );
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && pendingReads.current.size > 0) {
        if (readTimer.current) clearTimeout(readTimer.current);
        readTimer.current = setTimeout(flushReads, 600);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (readTimer.current) clearTimeout(readTimer.current);
    };
  }, [flushReads]);

  const inflight = useRef(new Set<string>());
  const reloadHistory = useCallback(async (id: string) => {
    if (inflight.current.has(id)) return;
    inflight.current.add(id);
    try {
      const result = await conversationHistoryAction({ id });
      const loaded = result?.data?.history;
      if (loaded) setHistories((all) => ({ ...all, [id]: loaded }));
    } finally {
      inflight.current.delete(id);
    }
  }, []);

  // Opening a thread shows what is cached at once and re-reads it in the background.
  useEffect(() => {
    if (activeId) void reloadHistory(activeId);
  }, [activeId, reloadHistory]);

  const historiesRef = useRef(histories);
  useEffect(() => {
    historiesRef.current = histories;
  });
  const prefetch = useCallback(
    (id: string) => {
      if (!historiesRef.current[id]) void reloadHistory(id);
    },
    [reloadHistory],
  );

  const openConversation = useCallback(
    (id?: string) => {
      if (id === activeIdRef.current) return;
      window.history.pushState(null, "", inboxHref(view, id));
    },
    [view],
  );

  const mergeConversation = useCallback((id: string, update: Partial<Conversation>) => {
    setConversations((list) => list.map((c) => (c.id === id ? patch(c, update) : c)).sort(byRecent));
  }, []);

  const handlers = {
    [EVENTS.messageNew]: ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
      if (!conversationsRef.current.some((c) => c.id === conversationId)) {
        // A conversation this view doesn't hold yet (often a brand-new one): re-read the list.
        refreshSoon();
      }
      // Cached threads stay current, so reopening one is instant and correct.
      updateHistory(conversationId, (h) => appendMessage(h, message));
      if (conversationId === activeIdRef.current && message.direction === "inbound") markReadSoon(conversationId);
    },
    [EVENTS.conversationUpdated]: (update: Partial<Conversation> & { id: string }) => {
      const isActive = update.id === activeIdRef.current;
      // The open thread is being read, so its unread count stays at zero.
      if (isActive && update.unreadCount) {
        mergeConversation(update.id, { ...update, unreadCount: 0 });
        markReadSoon(update.id);
      } else {
        mergeConversation(update.id, update);
      }
    },
    [EVENTS.conversationStatusChanged]: ({ id, status }: { id: string; status: Conversation["status"] }) => mergeConversation(id, { status }),
    [EVENTS.conversationAssigned]: (p: { id: string; assignedToUserId: string; assignedToUserName: string }) =>
      mergeConversation(p.id, { assignedToUserId: p.assignedToUserId, assignedToUserName: p.assignedToUserName, assignmentStatus: "assigned" }),
    [EVENTS.conversationUnassigned]: ({ id }: { id: string }) =>
      mergeConversation(id, { assignedToUserId: null, assignedToUserName: null, assignmentStatus: "unassigned" }),
    [EVENTS.messageStatusUpdated]: ({ conversationId, messageIds, status }: { conversationId: string; messageIds: string[]; status: ChatMessageStatus }) => {
      const ids = new Set(messageIds);
      updateHistory(conversationId, (h) =>
        h.map((entry) =>
          entry.kind === "message" && ids.has(entry.id) && RECEIPT_RANK[status] > RECEIPT_RANK[entry.status ?? "sent"] ? { ...entry, status } : entry,
        ),
      );
    },
    [EVENTS.conversationActivity]: ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== activeIdRef.current) {
        // Not on screen: drop the cached copy so the next open re-reads it.
        setHistories((all) => {
          if (!all[conversationId]) return all;
          const rest = { ...all };
          delete rest[conversationId];
          return rest;
        });
        return;
      }
      void reloadHistory(conversationId);
      setCustomerVersion((n) => n + 1);
    },
    [EVENTS.conversationViewers]: ({ conversationId, viewers: list }: { conversationId: string; viewers: Agent[] }) =>
      setViewers((all) => ({ ...all, [conversationId]: list })),
    [EVENTS.agentTyping]: ({ conversationId, agent, typing: on }: { conversationId: string; agent: Agent; typing: boolean }) => {
      setTyping((all) => {
        const here = { ...all[conversationId] };
        if (on) here[agent.id] = { ...agent, until: Date.now() + TYPING_TTL_MS };
        else delete here[agent.id];
        return { ...all, [conversationId]: here };
      });
      if (on) {
        setTimeout(() => {
          setTyping((all) => {
            const entry = all[conversationId]?.[agent.id];
            if (!entry || entry.until > Date.now()) return all;
            const here = { ...all[conversationId] };
            delete here[agent.id];
            return { ...all, [conversationId]: here };
          });
        }, TYPING_TTL_MS + 100);
      }
    },
  };

  const connectedOnce = useRef(false);
  const { socket, connected } = useChatSocket(handlers, () => {
    // After a reconnect, re-read what may have changed while offline.
    if (connectedOnce.current) {
      refreshSoon();
      if (activeIdRef.current) void reloadHistory(activeIdRef.current);
    }
    connectedOnce.current = true;
  });

  // Joining the open thread registers presence and lets this agent type there.
  useEffect(() => {
    if (!socket || !connected || !activeId) return;
    socket.emit(EVENTS.joinConversation, activeId);
    return () => {
      socket.emit(EVENTS.leaveConversation, activeId);
    };
  }, [socket, connected, activeId]);

  // Opening a thread reads it.
  const activeUnread = active?.unreadCount ?? 0;
  useEffect(() => {
    if (activeId && activeUnread > 0) markReadSoon(activeId);
  }, [activeId, activeUnread, markReadSoon]);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (readTimer.current) clearTimeout(readTimer.current);
    },
    [],
  );

  const typingIn = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [conversationId, agentsHere] of Object.entries(typing)) {
      const names = Object.values(agentsHere)
        .filter((agent) => agent.id !== meId)
        .map((agent) => agent.name);
      if (names.length) out[conversationId] = names;
    }
    return out;
  }, [typing, meId]);

  const onTyping = useCallback(
    (on: boolean) => {
      if (socket && connected && activeId) socket.emit(EVENTS.agentTyping, { conversationId: activeId, typing: on });
    },
    [socket, connected, activeId],
  );

  const onSent = useCallback(
    (message: ChatMessage) => {
      if (activeIdRef.current) updateHistory(activeIdRef.current, (h) => appendMessage(h, message));
    },
    [updateHistory],
  );

  return (
    // Sized by the space the dashboard actually gives it (container queries), not the window,
    // so the columns never overflow next to the sidebar.
    <div className="@container h-[calc(100dvh-11rem)] min-h-128 overflow-hidden rounded-lg border bg-background">
      <div className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)] @3xl:grid-cols-[17rem_minmax(0,1fr)] @6xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        {/* Narrow: the list or the open thread, one at a time. */}
        <div className={cn("min-h-0 @3xl:border-r", active && "hidden @3xl:block")}>
          <ConversationList
            view={view}
            conversations={conversations}
            activeId={activeId}
            typingIn={typingIn}
            connected={connected}
            onOpen={openConversation}
            onIntent={prefetch}
          />
        </div>

        {active ? (
          <div className="min-h-0 min-w-0">
            <ChatThread
              key={active.id}
              conversation={active}
              history={history ?? []}
              loading={!history}
              onSent={onSent}
              agents={agents}
              meId={meId}
              viewers={(viewers[active.id] ?? []).filter((viewer) => viewer.id !== meId)}
              typing={typingIn[active.id] ?? []}
              onTyping={onTyping}
              onShowCustomer={() => setCustomerSheetOpen(true)}
              onBack={() => openConversation(undefined)}
            />
          </div>
        ) : (
          <div className="hidden flex-col items-center justify-center gap-2 px-6 py-16 text-center @3xl:flex">
            <MessagesSquare className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">{conversations.length ? "Pick a conversation" : "Nothing to answer"}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {conversations.length ? "Choose a thread on the left to read and reply." : "Connect a Meta page to bring Messenger and Instagram conversations in here."}
            </p>
          </div>
        )}

        {active && (
          <aside className="hidden min-h-0 min-w-0 overflow-y-auto border-l @6xl:block" aria-label="Customer">
            <CustomerPanel conversation={active} version={customerVersion} />
          </aside>
        )}
      </div>

      {/* Without room for a third column, the thread's "Customer" button opens this. */}
      {active && (
        <Sheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen}>
          <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-sm">
            <SheetHeader className="border-b">
              <SheetTitle>Customer</SheetTitle>
            </SheetHeader>
            {customerSheetOpen && <CustomerPanel conversation={active} version={customerVersion} />}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
