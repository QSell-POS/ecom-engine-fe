"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { conversationTitle, type Conversation } from "@/lib/api/chat/types";
import { cn } from "@/lib/utils";

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

function ago(value?: string | null) {
  if (!value) return "";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 60) return relative.format(-minutes, "minute");
  if (minutes < 60 * 24) return relative.format(-Math.round(minutes / 60), "hour");
  return relative.format(-Math.round(minutes / 1440), "day");
}

export function ConversationList({ conversations, activeId }: { conversations: Conversation[]; activeId?: string }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
        <MessagesSquare className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No conversations</p>
        <p className="text-xs text-muted-foreground">Connect a Meta page and messages land here.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <Link
            href={`/chat?open=${conversation.id}`}
            scroll={false}
            className={cn(
              "flex flex-col gap-1 px-4 py-3 text-sm transition-colors hover:bg-muted/60",
              conversation.id === activeId && "bg-muted",
            )}
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate font-medium">{conversationTitle(conversation)}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{ago(conversation.lastMessageAt)}</span>
            </span>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-muted-foreground">{conversation.lastMessagePreview ?? "—"}</span>
              {Boolean(conversation.unreadCount) && (
                <span className="shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">{conversation.unreadCount}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
