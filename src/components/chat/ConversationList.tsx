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

export function ConversationList({
  view,
  conversations,
  activeId,
  typingIn,
  connected,
}: {
  view: InboxView;
  conversations: Conversation[];
  activeId?: string;
  /** Conversation id → names of agents typing there. */
  typingIn: Record<string, string[]>;
  connected: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex flex-wrap gap-1 border-b px-3 py-2" aria-label="Inbox views">
        {INBOX_VIEWS.map((item) => (
          <Link
            key={item}
            href={inboxHref(item)}
            scroll={false}
            aria-current={item === view ? "page" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              item === view && "bg-muted text-foreground",
            )}
          >
            {INBOX_VIEW_LABELS[item]}
          </Link>
        ))}
        <span
          className="ml-auto flex items-center gap-1.5 self-center text-[11px] text-muted-foreground"
          title={connected ? "New messages appear as they arrive" : "Reconnecting; refresh to catch up"}
        >
          <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-warning")} />
          {connected ? "Live" : "Offline"}
        </span>
      </nav>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <MessagesSquare className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">{view === "all" ? "No conversations" : `Nothing in ${INBOX_VIEW_LABELS[view].toLowerCase()}`}</p>
          {view === "all" && <p className="text-xs text-muted-foreground">Connect a Meta page and messages land here.</p>}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {conversations.map((conversation) => {
            const title = conversationTitle(conversation);
            const typing = typingIn[conversation.id];
            const unread = conversation.unreadCount ?? 0;
            return (
              <li key={conversation.id}>
                <Link
                  href={inboxHref(view, conversation.id)}
                  scroll={false}
                  className={cn(
                    "flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/60",
                    conversation.id === activeId && "bg-muted",
                  )}
                >
                  <Avatar className="size-9 shrink-0">
                    {conversation.participantAvatarUrl && <AvatarImage src={conversation.participantAvatarUrl} alt="" />}
                    <AvatarFallback className="text-xs">{initials(title) || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{ago(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate text-xs", typing?.length ? "text-primary" : "text-muted-foreground")}>
                        {typing?.length ? `${typing.join(", ")} typing…` : (conversation.lastMessagePreview ?? "—")}
                      </span>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">{unread}</span>
                      )}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {conversation.platform === "instagram" ? "Instagram" : "Messenger"}
                      {" · "}
                      {conversation.assignedToUserName ?? "Unassigned"}
                      {conversation.status !== "open" && ` · ${conversation.status}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
