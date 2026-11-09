"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Archive, ArrowLeft, Check, CheckCheck, ChevronDown, Clock, Eye, Link2, RotateCcw, Send, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StatusLabel } from "@/components/common/StatusLabel";
import { useCan } from "@/components/auth/PermissionsProvider";
import {
  assignConversationAction,
  sendChatMessageAction,
  sendTrackingLinkAction,
  setConversationStatusAction,
  unassignConversationAction,
} from "@/lib/api/chat/action";
import {
  CONVERSATION_STATUS_LABELS,
  conversationTitle,
  messagingWindowOpen,
  type ChatAgent,
  type ChatMessage,
  type Conversation,
  type ConversationEvent,
  type ConversationHistoryEntry,
  type ConversationStatus,
} from "@/lib/api/chat/types";
import { ORDER_ROUTES } from "@/lib/api/order/constants";
import { cn } from "@/lib/utils";
import { ago, initials } from "./ConversationList";

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

const STATUS_TONES = { open: "info", pending: "warning", resolved: "success", archived: "neutral" } as const;

/** How long after the last keystroke the composer reports "stopped typing". */
const TYPING_IDLE_MS = 4_000;
/** Minimum gap between "typing" pings while the agent keeps typing. */
const TYPING_PING_MS = 2_500;

type ActionResult<T> = { data?: T; serverError?: string } | undefined;

/**
 * One thread: messages and the activity log in one timeline, assignment and
 * status in the header, and a composer that respects Meta's 24-hour window.
 * Live state (new messages, receipts, who's here, who's typing) comes from
 * the inbox's socket through props. The inbox keys it by conversation, so
 * switching threads starts fresh (empty draft, scrolled to the newest).
 */
export function ChatThread({
  conversation,
  history,
  onSent,
  agents,
  meId,
  viewers,
  typing,
  onTyping,
  onShowCustomer,
  onBack,
  loading = false,
}: {
  conversation: Conversation;
  history: ConversationHistoryEntry[];
  /** A message this agent just sent, to show before the socket echoes it. */
  onSent: (message: ChatMessage) => void;
  agents: ChatAgent[];
  meId?: string;
  /** Other agents with this thread open. */
  viewers: { id: string; name: string }[];
  /** Other agents typing here right now. */
  typing: string[];
  onTyping: (typing: boolean) => void;
  /** Opens the customer panel where it isn't shown as a column. */
  onShowCustomer?: () => void;
  /** Back to the conversation list, where the list and thread don't fit side by side. */
  onBack?: () => void;
  /** The history is still being fetched (first open of this thread). */
  loading?: boolean;
}) {
  const canReply = useCan("chat:reply");
  const canViewOrders = useCan("orders:view");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastPing = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = conversationTitle(conversation);
  const closed = conversation.status === "resolved" || conversation.status === "archived";
  // Re-evaluated on every render; the inbox re-renders at least on each event.
  const windowOpen = messagingWindowOpen(conversation);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [history.length, typing.length]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  function stopTyping() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
    if (lastPing.current) onTyping(false);
    lastPing.current = 0;
  }

  function typed(value: string) {
    setDraft(value);
    if (!value.trim()) return stopTyping();
    const now = Date.now();
    if (now - lastPing.current > TYPING_PING_MS) {
      lastPing.current = now;
      onTyping(true);
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  function run<T>(action: () => Promise<ActionResult<T>>, success?: string, after?: (data: T) => void) {
    startTransition(async () => {
      const result = await action();
      if (!result?.data) {
        toast.error(result?.serverError ?? "That did not work.");
        return;
      }
      if (success) toast.success(success);
      after?.(result.data);
    });
  }

  function send() {
    const text = draft.trim();
    if (!text || isPending) return;
    stopTyping();
    stickToBottom.current = true;
    run(
      () => sendChatMessageAction({ id: conversation.id, text }),
      undefined,
      (data) => {
        setDraft("");
        onSent(data.message);
      },
    );
  }

  function setStatus(status: ConversationStatus, message: string) {
    run(() => setConversationStatusAction({ id: conversation.id, status }), message);
  }

  function assign(assigneeId: string) {
    if (assigneeId === "") {
      if (conversation.assignedToUserId) run(() => unassignConversationAction({ id: conversation.id }), "Unassigned");
      return;
    }
    if (assigneeId === conversation.assignedToUserId) return;
    const name = agents.find((agent) => agent.id === assigneeId)?.name;
    run(() => assignConversationAction({ id: conversation.id, assigneeId }), assigneeId === meId ? "Assigned to you" : `Assigned to ${name ?? "them"}`);
  }

  function sendTracking(orderId: string) {
    stickToBottom.current = true;
    run(() => sendTrackingLinkAction({ id: conversation.id, orderId }), "Tracking link sent", (data) => onSent(data.message));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" className="-ml-2 size-8 @3xl:hidden" onClick={onBack} aria-label="Back to conversations">
              <ArrowLeft />
            </Button>
          )}
          <Avatar className="size-9">
            {conversation.participantAvatarUrl && <AvatarImage src={conversation.participantAvatarUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(title) || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {conversation.platform === "instagram" ? "Instagram" : "Messenger"}
              {conversation.pageName ? ` · ${conversation.pageName}` : ""}
              {conversation.customerId && canViewOrders && (
                <>
                  {" · "}
                  <Link href={`/orders?customerId=${conversation.customerId}`} className="underline-offset-2 hover:underline">
                    Customer&apos;s orders
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onShowCustomer && (
            <Button variant="outline" size="sm" className="@6xl:hidden" onClick={onShowCustomer}>
              <ShoppingBag /> Customer
            </Button>
          )}
          {viewers.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Also has this conversation open">
              <Eye className="size-3.5" />
              {viewers.map((viewer) => viewer.name).join(", ")}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canReply || isPending}>
                <UserRound />
                {conversation.assignedToUserId ? (conversation.assignedToUserId === meId ? "You" : conversation.assignedToUserName) : "Unassigned"}
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={conversation.assignedToUserId ?? ""} onValueChange={assign}>
                {agents.map((agent) => (
                  <DropdownMenuRadioItem key={agent.id} value={agent.id}>
                    {agent.name}
                    {agent.id === meId && <span className="ml-1 text-muted-foreground">(you)</span>}
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="">Unassigned</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canReply || isPending}>
                <StatusLabel tone={STATUS_TONES[conversation.status] ?? "neutral"}>{CONVERSATION_STATUS_LABELS[conversation.status] ?? conversation.status}</StatusLabel>
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.status !== "resolved" && (
                <DropdownMenuItem onSelect={() => setStatus("resolved", "Marked resolved")}>
                  <Check /> Resolve
                </DropdownMenuItem>
              )}
              {conversation.status !== "pending" && !closed && (
                <DropdownMenuItem onSelect={() => setStatus("pending", "Marked pending")}>
                  <Clock /> Mark pending
                </DropdownMenuItem>
              )}
              {conversation.status !== "open" && (
                <DropdownMenuItem onSelect={() => setStatus("open", "Reopened")}>
                  <RotateCcw /> Reopen
                </DropdownMenuItem>
              )}
              {conversation.status !== "archived" && (
                <DropdownMenuItem onSelect={() => setStatus("archived", "Archived")}>
                  <Archive /> Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {loading && history.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          history.length === 0 && <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
        )}
        {history.map((entry, i) => {
          const previous = history[i - 1];
          const newDay = entry.createdAt && (!previous?.createdAt || day.format(new Date(previous.createdAt)) !== day.format(new Date(entry.createdAt)));
          return (
            <div key={`${entry.kind}-${entry.id}`} className="space-y-3">
              {newDay && <p className="text-center text-[11px] font-medium text-muted-foreground">{day.format(new Date(entry.createdAt!))}</p>}
              {entry.kind === "message" ? (
                <MessageBubble message={entry} />
              ) : (
                <ActivityLine
                  event={entry}
                  meId={meId}
                  onSendTracking={canReply && windowOpen && !closed ? sendTracking : undefined}
                  canViewOrders={canViewOrders}
                  disabled={isPending}
                />
              )}
            </div>
          );
        })}
        {typing.length > 0 && <p className="text-xs text-muted-foreground">{typing.join(", ")} {typing.length === 1 ? "is" : "are"} typing…</p>}
      </div>

      <Composer
        canReply={canReply}
        closed={closed}
        windowOpen={windowOpen}
        lastInboundAt={conversation.lastInboundAt}
        draft={draft}
        isPending={isPending}
        onChange={typed}
        onBlur={stopTyping}
        onSend={send}
        onReopen={() => setStatus("open", "Reopened")}
      />
    </div>
  );
}

function Composer({
  canReply,
  closed,
  windowOpen,
  lastInboundAt,
  draft,
  isPending,
  onChange,
  onBlur,
  onSend,
  onReopen,
}: {
  canReply: boolean;
  closed: boolean;
  windowOpen: boolean;
  lastInboundAt?: string | null;
  draft: string;
  isPending: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onSend: () => void;
  onReopen: () => void;
}) {
  if (!canReply) {
    return <p className="border-t px-5 py-3 text-xs text-muted-foreground">You can read this conversation but not reply. Ask the store owner for chat reply access.</p>;
  }
  if (closed) {
    return (
      <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
        <span>This conversation is closed. A new message from the customer reopens it.</span>
        <Button variant="outline" size="sm" onClick={onReopen} disabled={isPending}>
          <RotateCcw /> Reopen
        </Button>
      </div>
    );
  }
  if (!windowOpen) {
    return (
      <p className="border-t px-5 py-3 text-xs text-muted-foreground">
        Meta only allows replies within 24 hours of the customer&apos;s last message
        {lastInboundAt ? ` (${ago(lastInboundAt)})` : ""}. You can reply as soon as they message again.
      </p>
    );
  }
  return (
    <div className="flex items-end gap-2 border-t px-5 py-3">
      <Textarea
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter adds a line, as in every chat app.
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder="Write a reply…"
        className="max-h-40 min-h-11 resize-none"
        maxLength={2000}
      />
      <Button onClick={onSend} disabled={isPending || !draft.trim()}>
        {isPending ? <Spinner /> : <Send />}
        Send
      </Button>
    </div>
  );
}

function Receipt({ status }: { status?: ChatMessage["status"] }) {
  if (status === "failed") return <span className="text-destructive">Failed</span>;
  if (status === "read") return <CheckCheck className="size-3.5 text-sky-300" aria-label="Read" />;
  if (status === "delivered") return <CheckCheck className="size-3.5" aria-label="Delivered" />;
  return <Check className="size-3.5" aria-label="Sent" />;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const outbound = message.direction === "outbound";
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", outbound ? "bg-primary text-primary-foreground" : "bg-muted")}>
        {outbound && message.senderDisplayName && <p className="mb-0.5 text-[11px] font-medium text-primary-foreground/70">{message.senderDisplayName}</p>}
        {message.attachments?.map((attachment, i) =>
          attachment.type === "image" && attachment.url ? (
            <a key={i} href={attachment.url} target="_blank" rel="noreferrer" className="mb-1 block">
              {/* eslint-disable-next-line @next/next/no-img-element -- Meta CDN URLs, short-lived and unknown in advance */}
              <img src={attachment.url} alt={attachment.title ?? "Image"} className="max-h-60 rounded-md" />
            </a>
          ) : attachment.url ? (
            <a key={i} href={attachment.url} target="_blank" rel="noreferrer" className="mb-1 block underline underline-offset-2">
              {attachment.title || `${attachment.type} attachment`}
            </a>
          ) : (
            <p key={i} className="mb-1 italic opacity-80">
              [{attachment.type}]
            </p>
          ),
        )}
        {message.text && <p className="whitespace-pre-line break-words">{message.text}</p>}
        {message.createdAt && (
          <p className={cn("mt-1 flex items-center justify-end gap-1 text-[11px]", outbound ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {time.format(new Date(message.createdAt))}
            {outbound && <Receipt status={message.status} />}
          </p>
        )}
      </div>
    </div>
  );
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function describe(event: ConversationEvent, meId?: string): string {
  const meta = event.metadata ?? {};
  const actor = event.actorUserId && event.actorUserId === meId ? "You" : (event.actorUserName ?? "Someone");
  switch (event.type) {
    case "assigned":
      return `${actor} assigned this to ${text(meta.newAssigneeName) || "someone"}`;
    case "reassigned":
      return `${actor} reassigned this from ${text(meta.previousAssigneeName) || "someone"} to ${text(meta.newAssigneeName) || "someone"}`;
    case "unassigned":
      return `${actor} unassigned ${text(meta.previousAssigneeName) || "this"}`;
    case "status_changed":
      if (meta.reason === "inbound_message") return "Reopened by a new message from the customer";
      return `${actor} marked this ${text(meta.newStatus) || "updated"}`;
    case "customer_linked":
      if (meta.reason === "known_chat_identity") return "Linked to a customer who has chatted from this account before";
      return `${actor} linked this chat to a customer`;
    case "customer_created":
      return `${actor} created a customer from this chat`;
    case "order_created":
      return `${actor} created order #${text(meta.orderNumber)}`;
    case "tracking_link_sent":
      return `${actor} sent the tracking link for order #${text(meta.orderNumber)}`;
    default:
      return `${actor} updated this conversation`;
  }
}

function ActivityLine({
  event,
  meId,
  onSendTracking,
  canViewOrders,
  disabled,
}: {
  event: ConversationEvent;
  meId?: string;
  onSendTracking?: (orderId: string) => void;
  canViewOrders: boolean;
  disabled: boolean;
}) {
  const orderId = text(event.metadata?.orderId);
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-muted-foreground">
      <span>{describe(event, meId)}</span>
      {event.createdAt && <span>· {time.format(new Date(event.createdAt))}</span>}
      {event.type === "order_created" && orderId && (
        <>
          {canViewOrders && (
            <Link href={ORDER_ROUTES.detail(orderId)} className="font-medium text-foreground underline-offset-2 hover:underline">
              View order
            </Link>
          )}
          {onSendTracking && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSendTracking(orderId)}
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
            >
              <Link2 className="size-3" /> Send tracking link
            </button>
          )}
        </>
      )}
    </div>
  );
}
