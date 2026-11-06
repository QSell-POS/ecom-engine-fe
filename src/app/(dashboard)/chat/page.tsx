import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { ConnectMetaButton } from "@/components/chat/ConnectMetaButton";
import { ApiError } from "@/lib/api/client";
import { getChatAgents, getChatConnectUrl, getConversationHistory, getConversations, viewFilters } from "@/lib/api/chat/service";
import { INBOX_VIEWS, type InboxView } from "@/lib/api/chat/types";
import { can, denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Chat" };

/** Returns undefined instead of throwing, so one missing piece cannot blank the page. */
async function soft<T>(load: () => Promise<T>): Promise<{ value?: T; error?: string }> {
  try {
    return { value: await load() };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ open?: string; view?: string }> }) {
  const denied = await denyUnless("chat:view");
  if (denied) return denied;

  const { open, view: rawView } = await searchParams;
  const view: InboxView = (INBOX_VIEWS as readonly string[]).includes(rawView ?? "") ? (rawView as InboxView) : "all";
  const canManage = await can("chat:manage");

  const [conversations, connect, agents] = await Promise.all([
    soft(() => getConversations({ limit: 100, ...viewFilters(view) })),
    canManage ? soft(() => getChatConnectUrl()) : Promise.resolve({ value: undefined, error: undefined }),
    soft(() => getChatAgents()),
  ]);
  const list = conversations.value?.data ?? [];
  // Only an explicitly opened thread is shown; on a phone, opening the first one would hide the list.
  const active = open ? list.find((conversation) => conversation.id === open) : undefined;
  const history = active ? await soft(() => getConversationHistory(active.id)) : undefined;

  return (
    <>
      <PageHeader
        title="Chat"
        description="Messenger and Instagram threads, answered from here."
        actions={canManage ? <ConnectMetaButton connectUrl={connect.value?.url} error={connect.error} /> : undefined}
      />

      {conversations.error ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{conversations.error}</p>
      ) : (
        <ChatInbox
          view={view}
          conversations={list}
          activeId={active?.id}
          history={history?.value ?? []}
          agents={agents.value?.agents ?? []}
          meId={agents.value?.meId}
        />
      )}
    </>
  );
}
