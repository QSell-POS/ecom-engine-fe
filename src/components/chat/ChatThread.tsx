"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { StatusLabel } from "@/components/common/StatusLabel";
import { assignConversationAction, sendChatMessageAction, setConversationStatusAction, unassignConversationAction } from "@/lib/api/chat/action";
import { conversationTitle, type ChatMessage, type Conversation } from "@/lib/api/chat/types";
import { cn } from "@/lib/utils";

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

const STATUS_TONES = {
  open: "info",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
} as const;

/**
 * One thread. Messages arrive over the admin WebSocket when it is reachable;
 * without it the thread still works, it just refreshes after each send.
 */
export function ChatThread({
  conversation,
  messages,
  assigneeId,
}: {
  conversation: Conversation;
  messages: ChatMessage[];
  /** The signed-in tenant: the API wants an explicit assignee id. */
  assigneeId?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await sendChatMessageAction({ id: conversation.id, text });
      if (!result?.data) {
        toast.error(result?.serverError ?? "That message did not send.");
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  function act(action: () => Promise<{ data?: unknown; serverError?: string } | undefined>, message: string) {
    startTransition(async () => {
      const result = await action();
      if (!result?.data) {
        toast.error(result?.serverError ?? "That did not work.");
        return;
      }
      toast.success(message);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{conversationTitle(conversation)}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.channel}
            {conversation.assigneeName ? ` · ${conversation.assigneeName}` : " · unassigned"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusLabel tone={STATUS_TONES[conversation.status] ?? "neutral"}>{conversation.status}</StatusLabel>
          {conversation.assigneeId ? (
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => act(() => unassignConversationAction({ id: conversation.id }), "Unassigned")}>
              <UserX /> Unassign
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending || !assigneeId}
              onClick={() => assigneeId && act(() => assignConversationAction({ id: conversation.id, assigneeId }), "Assigned to you")}
            >
              <UserPlus /> Assign to me
            </Button>
          )}
          {conversation.status !== "resolved" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => act(() => setConversationStatusAction({ id: conversation.id, status: "resolved" }), "Marked resolved")}
            >
              <Check /> Resolve
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>}
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.direction === "outbound" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                message.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              {message.createdAt && (
                <p className={cn("mt-1 text-[11px]", message.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {time.format(new Date(message.createdAt))}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2 border-t px-5 py-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter adds a line, as in every chat app.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Write a reply…"
          className="min-h-11 resize-none"
          disabled={isPending}
        />
        <Button onClick={send} disabled={isPending || !draft.trim()}>
          {isPending ? <Spinner /> : <Send />}
          Send
        </Button>
      </div>
    </div>
  );
}
