"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { INBOX_VIEWS, INBOX_VIEW_LABELS, conversationTitle, type Conversation, type InboxView } from "@/lib/api/chat/types";
import { cn } from "@/lib/utils";

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "narrow" });

export function ago(value?: string | null) {
  if (!value) return "";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return relative.format(-minutes, "minute");
  if (minutes < 60 * 24) return relative.format(-Math.round(minutes / 60), "hour");
  return relative.format(-Math.round(minutes / 1440), "day");
}

export function initials(name: string) {
  return name
    .replace(/^@/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function inboxHref(view: InboxView, open?: string) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (open) params.set("open", open);
  const query = params.toString();
  return query ? `/chat?${query}` : "/chat";
}

/** A plain left click; anything else (new tab, middle click) keeps the link's normal behaviour. */
function isPlainClick(event: React.MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function ConversationList({
  view,
  conversations,
  activeId,
  typingIn,
  connected,
  onOpen,
  onIntent,
}: {
  view: InboxView;
  conversations: Conversation[];
  activeId?: string;
  /** Conversation id → names of agents typing there. */
  typingIn: Record<string, string[]>;
  connected: boolean;
  /** Opens a thread in place, without a server round trip. */
  onOpen: (id: string) => void;
  /** The pointer is on a thread: a good moment to prefetch it. */
  onIntent: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <span
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          title={connected ? "New messages appear as they arrive" : "Reconnecting; refresh to catch up"}
        >
          <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-warning")} />
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-b px-3 py-2 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Inbox views"
      >
        {INBOX_VIEWS.map((item) => (
          <Link
            key={item}
            href={inboxHref(item)}
            scroll={false}
            aria-current={item === view ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              item === view && "bg-foreground text-background hover:bg-foreground hover:text-background",
            )}
          >
            {INBOX_VIEW_LABELS[item]}
          </Link>
        ))}
      </nav>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <MessagesSquare className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">{view === "all" ? "No conversations" : `Nothing in ${INBOX_VIEW_LABELS[view].toLowerCase()}`}</p>
          {view === "all" && <p className="text-xs text-muted-foreground">Connect a Meta page and messages land here.</p>}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto py-1">
          {conversations.map((conversation) => {
            const title = conversationTitle(conversation);
            const typing = typingIn[conversation.id];
            const unread = conversation.unreadCount ?? 0;
            const active = conversation.id === activeId;
            return (
              <li key={conversation.id} className="px-2">
                <a
                  href={inboxHref(view, conversation.id)}
                  aria-current={active ? "true" : undefined}
                  onClick={(event) => {
                    if (!isPlainClick(event)) return;
                    event.preventDefault();
                    onOpen(conversation.id);
                  }}
                  onPointerEnter={() => onIntent(conversation.id)}
                  onFocus={() => onIntent(conversation.id)}
                  className={cn("flex gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors hover:bg-muted/70", active && "bg-muted")}
                >
                  <span className="relative shrink-0">
                    <Avatar className="size-9">
                      {conversation.participantAvatarUrl && <AvatarImage src={conversation.participantAvatarUrl} alt="" />}
                      <AvatarFallback className="text-xs">{initials(title) || "?"}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background",
                        conversation.platform === "instagram" ? "bg-pink-500" : "bg-blue-500",
                      )}
                      title={conversation.platform === "instagram" ? "Instagram" : "Messenger"}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{title}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-xs", typing?.length ? "text-primary" : unread ? "text-foreground" : "text-muted-foreground")}>
                        {typing?.length ? `${typing.join(", ")} typing…` : (conversation.lastMessagePreview ?? "—")}
                      </span>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">{unread}</span>
                      )}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {conversation.assignedToUserName ?? "Unassigned"}
                      {conversation.status !== "open" && ` · ${conversation.status}`}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
