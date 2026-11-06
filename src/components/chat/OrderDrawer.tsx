"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createChatOrderAction, quoteChatOrderAction, searchChatProductsAction } from "@/lib/api/chat/action";
import { messagingWindowOpen, type ChatCustomerSummary, type ChatOrderQuote, type Conversation } from "@/lib/api/chat/types";
import { PAYMENT_METHODS, paymentMethodLabel, type PaymentMethod } from "@/lib/api/order/types";
import { formatMoney } from "@/lib/constants/money";

type FoundProduct = { id: string; name: string; sku: string; price: number; available: number | null; image: string | null };
type Line = FoundProduct & { quantity: number };

const NEW_ADDRESS = "new";

/**
 * Builds an order without leaving the chat: products, delivery address,
 * payment, an optional discount code or agreed delivery price, and live
 * totals from the API (the same pricing as checkout).
 */
export function OrderDrawer({
  open,
  onOpenChange,
  conversation,
  addresses,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  addresses: ChatCustomerSummary["addresses"];
  onCreated: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>New order</SheetTitle>
          <SheetDescription>For {conversation.participantName ?? "this customer"}, from this conversation.</SheetDescription>
        </SheetHeader>
        {/* Mounted only while open, so every new order starts empty. */}
        {open && <OrderForm conversation={conversation} addresses={addresses} onCreated={onCreated} />}
      </SheetContent>
    </Sheet>
  );
}

function OrderForm({ conversation, addresses, onCreated }: { conversation: Conversation; addresses: ChatCustomerSummary["addresses"]; onCreated: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? NEW_ADDRESS);
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingRegion, setShippingRegion] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [discountCode, setDiscountCode] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const windowOpen = messagingWindowOpen(conversation);
  const [sendTrackingLink, setSendTrackingLink] = useState(true);
  const [quote, setQuote] = useState<ChatOrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const newAddress = addressId === NEW_ADDRESS;
  const items = useMemo(() => lines.map((line) => ({ productId: line.id, quantity: line.quantity })), [lines]);

  // Re-price whenever anything that affects the total changes (debounced).
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await quoteChatOrderAction({
        id: conversation.id,
        items,
        addressId: newAddress ? undefined : addressId,
        shippingCity: newAddress ? shippingCity : undefined,
        shippingRegion: newAddress ? shippingRegion : undefined,
        discountCode,
        deliveryCharge,
      });
      if (cancelled) return;
      if (result?.data) {
        setQuote(result.data.quote);
        setQuoteError(null);
      } else {
        setQuoteError(result?.serverError ?? "Couldn't price this order.");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversation.id, items, newAddress, addressId, shippingCity, shippingRegion, discountCode, deliveryCharge]);

  const shownQuote = items.length ? quote : null;

  function add(product: FoundProduct) {
    setLines((current) =>
      current.some((line) => line.id === product.id)
        ? current.map((line) => (line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))
        : [...current, { ...product, quantity: 1 }],
    );
  }

  function setQuantity(id: string, quantity: number) {
    setLines((current) => (quantity <= 0 ? current.filter((line) => line.id !== id) : current.map((line) => (line.id === id ? { ...line, quantity } : line))));
  }

  const addressReady = newAddress ? Boolean(shippingAddress.trim() && shippingCity.trim() && shippingRegion.trim()) : Boolean(addressId);
  const blocked = !lines.length || !addressReady || Boolean(shownQuote?.discountError) || Boolean(shownQuote?.deliveryError && !deliveryCharge);

  function submit() {
    startTransition(async () => {
      const result = await createChatOrderAction({
        id: conversation.id,
        items,
        paymentMethod,
        addressId: newAddress ? undefined : addressId,
        shippingAddress: newAddress ? shippingAddress : undefined,
        shippingCity: newAddress ? shippingCity : undefined,
        shippingRegion: newAddress ? shippingRegion : undefined,
        discountCode,
        deliveryCharge,
        customerNotes,
        sendTrackingLink: windowOpen && sendTrackingLink,
      });
      if (result?.validationErrors) return void toast.error("Check the order: something is missing or invalid.");
      if (!result?.data) return void toast.error(result?.serverError ?? "The order was not created.");
      toast.success(`Order #${result.data.order.orderNumber} created`);
      onCreated();
    });
  }

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 text-sm">
        <section className="space-y-2">
          <h3 className="font-medium">Products</h3>
          <ProductSearch onPick={add} />
          {lines.length > 0 && (
            <ul className="divide-y rounded-md border">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{line.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatMoney(line.price)}
                      {line.available !== null && line.quantity > line.available && <span className="ml-2 text-destructive">Only {Math.max(line.available, 0)} in stock</span>}
                    </span>
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label="One fewer">
                    {line.quantity === 1 ? <Trash2 /> : <Minus />}
                  </Button>
                  <span className="w-6 text-center tabular-nums">{line.quantity}</span>
                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="One more">
                    <Plus />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">Delivery address</h3>
          <div className="space-y-1.5">
            {addresses.map((address) => (
              <label key={address.id} className="flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 has-checked:border-primary">
                <input type="radio" name="address" className="mt-1" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
                <span>
                  <span className="block">{address.address}</span>
                  <span className="text-xs text-muted-foreground">
                    {address.city}, {address.region}
                  </span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 has-checked:border-primary">
              <input type="radio" name="address" checked={newAddress} onChange={() => setAddressId(NEW_ADDRESS)} />
              {addresses.length ? "A different address" : "Enter the address"}
            </label>
          </div>
          {newAddress && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="order-address">Street, area, landmark</Label>
                <Input id="order-address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="order-city">City</Label>
                <Input id="order-city" value={shippingCity} onChange={(event) => setShippingCity(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="order-region">Province / region</Label>
                <Input id="order-region" value={shippingRegion} onChange={(event) => setShippingRegion(event.target.value)} />
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="order-payment">Payment</Label>
            <select
              id="order-payment"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="order-discount">Discount code</Label>
            <Input id="order-discount" value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="Optional" />
            {shownQuote?.discountError && <p className="text-xs text-destructive">{shownQuote.discountError}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="order-delivery">Delivery charge</Label>
            <Input
              id="order-delivery"
              value={deliveryCharge}
              onChange={(event) => setDeliveryCharge(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="Store rate"
            />
            <p className="text-[11px] text-muted-foreground">Leave empty to use your delivery rates.</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="order-notes">Note</Label>
            <Textarea id="order-notes" value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} className="min-h-16" placeholder="Size, colour, delivery time…" />
          </div>
        </section>

        {shownQuote && (
          <dl className="space-y-1 rounded-md bg-muted/60 p-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(shownQuote.subtotal)}</dd>
            </div>
            {shownQuote.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">− {formatMoney(shownQuote.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {shownQuote.deliveryError && !deliveryCharge ? (
                  <span className="text-destructive">{shownQuote.deliveryError}</span>
                ) : shownQuote.deliveryKnown ? (
                  formatMoney(shownQuote.delivery)
                ) : (
                  <span className="text-muted-foreground">Needs an address</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(shownQuote.total)}</dd>
            </div>
          </dl>
        )}
        {quoteError && items.length > 0 && <p className="text-xs text-destructive">{quoteError}</p>}

        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={windowOpen && sendTrackingLink} disabled={!windowOpen} onCheckedChange={(checked) => setSendTrackingLink(checked === true)} className="mt-0.5" />
          <span>
            Send the tracking link in this chat
            {!windowOpen && <span className="block text-xs text-muted-foreground">Not possible: the customer last wrote more than 24 hours ago.</span>}
          </span>
        </label>
      </div>

      <SheetFooter className="border-t">
        <Button onClick={submit} disabled={blocked || isPending}>
          {isPending && <Spinner />}
          Create order{shownQuote ? ` · ${formatMoney(shownQuote.total)}` : ""}
        </Button>
      </SheetFooter>
    </>
  );
}

function ProductSearch({ onPick }: { onPick: (product: FoundProduct) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchChatProductsAction({ search });
      if (cancelled) return;
      setSearching(false);
      setResults(result?.data?.products ?? []);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const shown = query.trim().length < 2 ? [] : results;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products by name or SKU" className="pl-8" aria-label="Search products" />
        {searching && <Spinner className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />}
      </div>
      {shown.length > 0 && (
        <ul className="max-h-56 divide-y overflow-y-auto rounded-md border">
          {shown.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(product);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails from the media library */}
                {product.image ? <img src={product.image} alt="" className="size-8 rounded object-cover" /> : <span className="size-8 rounded bg-muted" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMoney(product.price)}
                    {product.sku && ` · ${product.sku}`}
                    {product.available !== null && ` · ${Math.max(product.available, 0)} in stock`}
                  </span>
                </span>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && !searching && shown.length === 0 && <p className="text-xs text-muted-foreground">No active products match.</p>}
    </div>
  );
}
