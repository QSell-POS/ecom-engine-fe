"use client";

import { useId } from "react";
import { Globe, PencilLine, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Where a conversation, customer or order came from, as a recognisable mark.
 *
 * One vocabulary across the admin: the order channels (`facebook`,
 * `instagram`, `whatsapp`, `e_commerce`, `pos`, `manual`). Chat uses the
 * first two; "messenger" is accepted as an alias of `facebook` for DMs.
 */
export type Channel = "facebook" | "messenger" | "instagram" | "whatsapp" | "e_commerce" | "pos" | "manual";

export const CHANNEL_META: Record<Channel, { label: string; badge: string }> = {
  facebook: { label: "Facebook", badge: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300" },
  messenger: { label: "Messenger", badge: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300" },
  instagram: { label: "Instagram", badge: "bg-pink-500/10 text-pink-700 ring-pink-500/20 dark:text-pink-300" },
  whatsapp: { label: "WhatsApp", badge: "bg-green-500/10 text-green-700 ring-green-500/20 dark:text-green-300" },
  e_commerce: { label: "Online store", badge: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300" },
  pos: { label: "POS", badge: "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300" },
  manual: { label: "Manual", badge: "bg-muted text-muted-foreground ring-border" },
};

/** A chat conversation's platform as a channel: Facebook DMs arrive via Messenger. */
export function chatChannel(platform: string): Channel {
  return platform === "facebook" ? "messenger" : isChannel(platform) ? platform : "manual";
}

export function channelLabel(channel?: string | null) {
  return (channel && CHANNEL_META[channel as Channel]?.label) || channel || "Unknown";
}

function isChannel(value?: string | null): value is Channel {
  return Boolean(value && value in CHANNEL_META);
}

/** The brand mark alone, in brand colours. `className` sets the size (default size-4). */
export function ChannelIcon({ channel, className, title }: { channel?: string | null; className?: string; title?: string }) {
  const gradientId = useId();
  const size = cn("size-4 shrink-0", className);
  const label = title ?? channelLabel(channel);
  // An empty title marks the icon as decorative (e.g. next to its own label).
  const a11y = label ? ({ role: "img", "aria-label": label } as const) : ({ "aria-hidden": true } as const);
  const svg = { viewBox: "0 0 24 24", className: size, ...a11y };

  switch (channel) {
    case "messenger":
      return (
        <svg {...svg}>
          {label && <title>{label}</title>}
          <defs>
            <linearGradient id={gradientId} x1="0.2" y1="1" x2="0.8" y2="0">
              <stop offset="0" stopColor="#0099FF" />
              <stop offset="0.6" stopColor="#A033FF" />
              <stop offset="1" stopColor="#FF5280" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${gradientId})`}
            d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.14 7.16.16.15.26.35.27.57l.05 1.78a.8.8 0 0 0 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.39 2.91.39 5.64 0 10-4.13 10-9.7S17.64 2 12 2Z"
          />
          <path
            fill="#fff"
            d="m6 14.54 2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63l-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63Z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...svg}>
          {label && <title>{label}</title>}
          <circle cx="12" cy="12" r="10" fill="#1877F2" />
          <path fill="#fff" d="M13.4 22v-7.1h2.4l.4-2.8h-2.8v-1.8c0-.8.2-1.4 1.4-1.4h1.5V6.4c-.3 0-1.1-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2.1H8.1v2.8h2.4V22h2.9Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...svg}>
          {label && <title>{label}</title>}
          <defs>
            <radialGradient id={gradientId} cx="0.3" cy="1.07" r="1.2">
              <stop offset="0" stopColor="#FFDD55" />
              <stop offset="0.1" stopColor="#FFDD55" />
              <stop offset="0.5" stopColor="#FF543E" />
              <stop offset="1" stopColor="#C837AB" />
            </radialGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${gradientId})`} />
          <rect x="6" y="6" width="12" height="12" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="15.6" cy="8.4" r="0.9" fill="#fff" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...svg}>
          {label && <title>{label}</title>}
          <path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2Z" />
          <path
            fill="#fff"
            d="M8.7 7.1c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3 0 .6.4.7 1 1.4 1.6 1.9.7.6 1.3.8 1.6.9.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3 0 .2 0 .9-.3 1.5-.3.6-1.4 1.2-2 1.2-.5 0-1.1.2-3.6-.8-3-1.2-4.9-4.2-5-4.4-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5Z"
          />
        </svg>
      );
    case "e_commerce":
      return <Globe className={cn(size, "text-slate-600 dark:text-slate-300")} {...a11y} />;
    case "pos":
      return <Store className={cn(size, "text-amber-600 dark:text-amber-400")} {...a11y} />;
    default:
      return <PencilLine className={cn(size, "text-muted-foreground")} {...a11y} />;
  }
}

/** Icon + label pill, for tables and profile headers. */
export function ChannelBadge({ channel, className }: { channel?: string | null; className?: string }) {
  const known = isChannel(channel) ? channel : "manual";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        CHANNEL_META[known].badge,
        className,
      )}
    >
      <ChannelIcon channel={known} className="size-3.5" title="" />
      {channelLabel(channel)}
    </span>
  );
}
