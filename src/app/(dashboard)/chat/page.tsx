import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { ConnectMetaButton } from "@/components/chat/ConnectMetaButton";
import { ConversationList } from "@/components/chat/ConversationList";
import { ApiError } from "@/lib/api/client";
import { getChatConnectUrl, getConversationMessages, getConversations } from "@/lib/api/chat/service";
import { getTenantSummary } from "@/lib/api/session";

export const metadata: Metadata = { title: "Chat" };

/** Returns undefined instead of throwing, so one missing piece cannot blank the page. */
async function soft<T>(load: () => Promise<T>): Promise<{ value?: T; error?: string }> {
  try {
    return { value: await load() };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;

  const [conversations, connect, tenant] = await Promise.all([
    soft(() => getConversations({ limit: 100 })),
    soft(() => getChatConnectUrl()),
    getTenantSummary(),
  ]);
  const list = conversations.value?.data ?? [];
  const active = list.find((conversation) => conversation.id === open) ?? list[0];
  const messages = active ? await soft(() => getConversationMessages(active.id, { limit: 100 })) : undefined;

  return (
    <>
      <PageHeader
        title="Chat"
        description="Messenger and Instagram threads, answered from here."
        actions={<ConnectMetaButton connectUrl={connect.value?.url} error={connect.error} />}
      />

      {conversations.error ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{conversations.error}</p>
      ) : (
        <div className="grid min-h-[32rem] overflow-hidden rounded-lg border lg:grid-cols-[20rem_1fr]">
          <div className="border-b lg:border-r lg:border-b-0">
            <ConversationList conversations={list} activeId={active?.id} />
          </div>
          {active ? (
            <ChatThread conversation={active} messages={messages?.value?.data ?? []} actor={tenant ? { id: tenant.id, name: tenant.name } : undefined} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <MessagesSquare className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">Nothing to answer</p>
              <p className="max-w-sm text-xs text-muted-foreground">Connect a Meta page to bring Messenger and Instagram conversations in here.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
