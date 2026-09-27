import type { SocialLinks } from "@/lib/storefront/types";

// Monochrome brand glyphs (lucide doesn't ship brand marks). 24px grid, currentColor.
const PATHS: Record<keyof SocialLinks, { label: string; d: string; stroke?: boolean }> = {
  instagram: { label: "Instagram", stroke: true, d: "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm4.5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.25-1.5h.01" },
  facebook: { label: "Facebook", d: "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" },
  x: { label: "X", d: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7-8.1L2.2 3h6.2l4.3 5.7L17.8 3Zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5Z" },
  tiktok: { label: "TikTok", d: "M16.6 3c.4 2.1 1.7 3.6 3.9 3.9v3c-1.4 0-2.7-.4-3.9-1.1v6.5a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.5V3h3Z" },
  youtube: { label: "YouTube", d: "M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" },
  pinterest: { label: "Pinterest", d: "M12.3 2C6.8 2 4 5.9 4 9.2c0 2 .8 3.8 2.4 4.4.3.1.5 0 .6-.3l.2-1c.1-.3 0-.4-.2-.7-.5-.6-.8-1.3-.8-2.4 0-3.1 2.3-5.8 6-5.8 3.3 0 5.1 2 5.1 4.7 0 3.5-1.6 6.5-3.9 6.5-1.3 0-2.2-1-1.9-2.3.4-1.5 1.1-3.2 1.1-4.3 0-1-.5-1.8-1.6-1.8-1.3 0-2.3 1.3-2.3 3.1 0 1.1.4 1.9.4 1.9l-1.5 6.4c-.4 1.9-.1 4.2 0 4.4 0 .1.2.2.3.1.1-.2 1.5-1.9 2-3.6l.8-3c.4.7 1.5 1.4 2.7 1.4 3.6 0 6-3.3 6-7.6C19.2 5.1 16.4 2 12.3 2Z" },
};

export function SocialIcons({ social, className }: { social: SocialLinks; className?: string }) {
  const entries = (Object.keys(PATHS) as (keyof SocialLinks)[]).filter((key) => social[key]);
  if (entries.length === 0) return null;
  return (
    <ul className={className ?? "flex items-center gap-1"}>
      {entries.map((key) => {
        const icon = PATHS[key];
        return (
          <li key={key}>
            <a href={social[key]} target="_blank" rel="noreferrer" aria-label={icon.label} className="sf-focus flex size-9 items-center justify-center rounded-full text-(--sf-muted) transition-colors hover:bg-(--sf-soft) hover:text-(--sf-fg)">
              <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden fill={icon.stroke ? "none" : "currentColor"} stroke={icon.stroke ? "currentColor" : "none"} strokeWidth={icon.stroke ? 1.8 : 0} strokeLinecap="round" strokeLinejoin="round">
                <path d={icon.d} />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
