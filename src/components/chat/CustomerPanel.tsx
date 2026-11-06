"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Link2, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusLabel } from "@/components/common/StatusLabel";
import { useCan } from "@/components/auth/PermissionsProvider";
import {
  conversationCustomerAction,
  createChatCustomerAction,
  linkChatCustomerAction,
  searchChatCustomersAction,
  sendTrackingLinkAction,
} from "@/lib/api/chat/action";
import { messagingWindowOpen, type ChatCustomerSummary, type Conversation } from "@/lib/api/chat/types";
import { ORDER_ROUTES } from "@/lib/api/order/constants";
import { orderStatuses } from "@/lib/api/order/grid";
import { formatMoney } from "@/lib/constants/money";
import { OrderDrawer } from "./OrderDrawer";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Beside the thread: who the customer is and what they have bought, with
 * "New order" one click away. An unlinked thread offers to find an existing
 * customer or create one (name and phone are enough).
 *
 * `version` changes whenever the conversation's activity does, which re-reads
 * the panel (a new order, a link, a status change made elsewhere).
 */
export function CustomerPanel({ conversation, version }: { conversation: Conversation; version: number }) {
  const [summary, setSummary] = useState<ChatCustomerSummary | null | undefined>(undefined);
  const [reload, setReload] = useState(0);
  const linkedId = conversation.customerId ?? null;

  useEffect(() => {
    let cancelled = false;
    conversationCustomerAction({ id: conversation.id }).then((result) => {
      if (cancelled) return;
      if (result?.data) setSummary(result.data.summary);
      else setSummary(null);
    });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, linkedId, version, reload]);

  if (summary === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (!summary) return <LinkCustomer conversation={conversation} onLinked={() => setReload((n) => n + 1)} />;
  return <CustomerSummary conversation={conversation} summary={summary} onChanged={() => setReload((n) => n + 1)} />;
}

function CustomerSummary({ conversation, summary, onChanged }: { conversation: Conversation; summary: ChatCustomerSummary; onChanged: () => void }) {
  const canReply = useCan("chat:reply");
  const canOrder = useCan("orders:update");
  const canPickProducts = useCan("products:view");
  const canViewOrders = useCan("orders:view");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { customer, stats, orders } = summary;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed customer";
  const closed = conversation.status === "resolved" || conversation.status === "archived";
  const canSendLinks = canReply && !closed && messagingWindowOpen(conversation);
  const active = orders.filter((order) => order.active);
  const past = orders.filter((order) => !order.active);

  function sendTracking(orderId: string) {
    startTransition(async () => {
      const result = await sendTrackingLinkAction({ id: conversation.id, orderId });
      if (!result?.data) toast.error(result?.serverError ?? "The tracking link did not send.");
      else toast.success("Tracking link sent");
    });
  }

  return (
    <div className="space-y-6 p-4 text-sm">
      <section className="space-y-1">
        <p className="font-semibold">{name}</p>
        {customer.phone && (
          <a href={`tel:${customer.phone}`} className="block text-muted-foreground hover:text-foreground">
            {customer.phone}
          </a>
        )}
        {customer.email ? (
          <a href={`mailto:${customer.email}`} className="block truncate text-muted-foreground hover:text-foreground">
            {customer.email}
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">No email on file</p>
        )}
      </section>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/60 px-2 py-2">
          <dt className="text-[11px] text-muted-foreground">Orders</dt>
          <dd className="font-semibold tabular-nums">{stats.orderCount}</dd>
        </div>
        <div className="rounded-md bg-muted/60 px-2 py-2">
          <dt className="text-[11px] text-muted-foreground">Spent</dt>
          <dd className="truncate font-semibold tabular-nums">{formatMoney(stats.totalSpent)}</dd>
        </div>
        <div className="rounded-md bg-muted/60 px-2 py-2">
          <dt className="text-[11px] text-muted-foreground">Last order</dt>
          <dd className="font-semibold">{stats.lastOrderAt ? date.format(new Date(stats.lastOrderAt)).replace(/, \d{4}$/, "") : "—"}</dd>
        </div>
      </dl>

      {canReply && canOrder && canPickProducts && (
        <Button className="w-full" onClick={() => setDrawerOpen(true)} disabled={closed}>
          <Plus /> New order
        </Button>
      )}

      <OrderList title="Active orders" empty="Nothing on its way." orders={active} canViewOrders={canViewOrders} onSendTracking={canSendLinks ? sendTracking : undefined} disabled={isPending} />
      {past.length > 0 && <OrderList title="Earlier orders" orders={past} canViewOrders={canViewOrders} disabled={isPending} />}
      {canViewOrders && stats.orderCount > orders.length && (
        <Link href={`/orders?customerId=${customer.id}`} className="block text-xs text-muted-foreground underline-offset-2 hover:underline">
          All {stats.orderCount} orders
        </Link>
      )}

      <OrderDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        conversation={conversation}
        addresses={summary.addresses}
        onCreated={() => {
          setDrawerOpen(false);
          onChanged();
        }}
      />
    </div>
  );
}

function OrderList({
  title,
  empty,
  orders,
  canViewOrders,
  onSendTracking,
  disabled,
}: {
  title: string;
  empty?: string;
  orders: ChatCustomerSummary["orders"];
  canViewOrders: boolean;
  onSendTracking?: (orderId: string) => void;
  disabled: boolean;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">{title}</h3>
      {orders.length === 0 && empty && <p className="text-xs text-muted-foreground">{empty}</p>}
      <ul className="space-y-2">
        {orders.map((order) => {
          const status = orderStatuses[order.status];
          return (
            <li key={order.id} className="rounded-md border">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">#{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {date.format(new Date(order.createdAt))} · {formatMoney(order.totalAmount)}
                    </span>
                  </span>
                  {status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : <span className="text-xs">{order.status}</span>}
                </summary>
                <div className="space-y-2 border-t px-3 py-2">
                  <ul className="space-y-1 text-xs">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate">{item.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {item.quantity} × {formatMoney(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {canViewOrders && (
                      <Link href={ORDER_ROUTES.detail(order.id)} className="font-medium underline-offset-2 hover:underline">
                        Open order
                      </Link>
                    )}
                    {onSendTracking && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSendTracking(order.id)}
                        className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        <Link2 className="size-3" /> Send tracking link
                      </button>
                    )}
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type FoundCustomer = { id: string; name: string | null; email: string | null; phone: string | null };

function LinkCustomer({ conversation, onLinked }: { conversation: Conversation; onLinked: () => void }) {
  const canReply = useCan("chat:reply");
  const canSearch = useCan("customers:view");
  const canCreate = useCan("customers:create");
  const [mode, setMode] = useState<"find" | "create">(canSearch ? "find" : "create");
  const [isPending, startTransition] = useTransition();

  if (!canReply || (!canSearch && !canCreate)) {
    return <p className="p-4 text-xs text-muted-foreground">This chat isn&apos;t linked to a customer yet.</p>;
  }

  function link(customerId: string) {
    startTransition(async () => {
      const result = await linkChatCustomerAction({ id: conversation.id, customerId });
      if (!result?.data) return void toast.error(result?.serverError ?? "Couldn't link that customer.");
      toast.success("Customer linked");
      onLinked();
    });
  }

  return (
    <div className="space-y-4 p-4 text-sm">
      <div>
        <p className="font-semibold">No customer yet</p>
        <p className="text-xs text-muted-foreground">Link one to see their orders and create new ones from this chat.</p>
      </div>
      {canSearch && canCreate && (
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-xs font-medium">
          {(["find", "create"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={mode === item ? "rounded bg-background py-1 shadow-sm" : "py-1 text-muted-foreground"}
            >
              {item === "find" ? "Find existing" : "New customer"}
            </button>
          ))}
        </div>
      )}
      {mode === "find" && canSearch ? (
        <FindCustomer onPick={link} disabled={isPending} />
      ) : (
        <CreateCustomer conversation={conversation} onCreated={onLinked} onConflict={canSearch ? link : undefined} />
      )}
    </div>
  );
}

function FindCustomer({ onPick, disabled }: { onPick: (id: string) => void; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundCustomer[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchChatCustomersAction({ search });
      if (cancelled) return;
      setSearching(false);
      setResults(result?.data?.customers ?? []);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const shown = query.trim().length < 2 ? null : results;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email or phone" className="pl-8" aria-label="Search customers" />
      </div>
      {searching && <Spinner className="mx-auto text-muted-foreground" />}
      {shown && !searching && shown.length === 0 && <p className="text-xs text-muted-foreground">No customers match.</p>}
      <ul className="space-y-1">
        {shown?.map((customer) => (
          <li key={customer.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(customer.id)}
              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50"
            >
              <span className="block font-medium">{customer.name ?? customer.email ?? customer.phone ?? "Unnamed"}</span>
              <span className="block truncate text-xs text-muted-foreground">{[customer.phone, customer.email].filter(Boolean).join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateCustomer({
  conversation,
  onCreated,
  onConflict,
}: {
  conversation: Conversation;
  onCreated: () => void;
  onConflict?: (customerId: string) => void;
}) {
  const [first, ...rest] = (conversation.participantName ?? "").replace(/^@/, "").trim().split(/\s+/);
  const [firstName, setFirstName] = useState(first ?? "");
  const [lastName, setLastName] = useState(rest.join(" "));
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createChatCustomerAction({ id: conversation.id, firstName, lastName, phone, email });
      if (result?.validationErrors) return void toast.error("Check the phone number and email.");
      if (!result?.data) return void toast.error(result?.serverError ?? "Couldn't create the customer.");
      toast.success("Customer created and linked");
      onCreated();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="chat-first">First name</Label>
          <Input id="chat-first" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="chat-last">Last name</Label>
          <Input id="chat-last" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="chat-phone">Phone</Label>
        <Input id="chat-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="98XXXXXXXX" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="chat-email">
          Email <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="chat-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Spinner /> : <UserPlus />} Create and link
      </Button>
      {onConflict && <p className="text-[11px] text-muted-foreground">If the phone or email already belongs to a customer, find and link them instead.</p>}
    </form>
  );
}
