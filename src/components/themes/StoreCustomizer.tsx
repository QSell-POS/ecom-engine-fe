"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, ExternalLink, LayoutTemplate, Monitor, PartyPopper, Plus, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { StoreFrame } from "@/components/storefront/overlay";
import { StoreChrome } from "@/components/storefront/shell";
import { StoreProvider, type StoreInfo } from "@/components/storefront/store-context";
import { ThemeRenderer } from "@/components/storefront/ThemeRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveStoreDesignAction } from "@/lib/api/theme/action";
import { THEME_ROUTES } from "@/lib/api/theme/constants";
import { CURRENCIES, StoreProfileSchema } from "@/lib/storefront/profile";
import type { HomeData, SocialLinks, StoreProfile } from "@/lib/storefront/types";
import { FONT_PAIRINGS, FONTS } from "@/lib/theme-engine/schema";
import type { SettingValues, ThemeDocument } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { ImageField } from "./ImageField";

// The everyday way to make a store yours: identity, brand color, fonts,
// announcement, contact, social and basic store settings, with a live
// preview. No sections, blocks or layouts; that's what the builder is for.

type Brand = { colorPrimary: string; colorPrimaryText: string; fontHeading: string; fontBody: string };

const SWATCHES = ["#18181b", "#1c1917", "#2563eb", "#4a5a45", "#0f766e", "#a05a4f", "#9f1239", "#7c3aed", "#b45309", "#1e3a5f"];

function readableTextOn(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#111111" : "#ffffff";
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourstore" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourstore" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourstore" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourstore" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourstore" },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/yourstore" },
];

function Group({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-5 border-b pb-8 last:border-b-0">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ------------------------------------------------------------ live preview

/**
 * Fast preview. Brand color and fonts only reach the storefront as CSS
 * variables on its root element, so `settings` changes re-render just that
 * frame; the storefront tree (`page`) is memoized and skipped. Profile edits
 * (`store`, deferred by the caller) re-render the tree at low priority.
 */
const LivePreview = memo(function LivePreview({
  store,
  settings,
  document,
  data,
}: {
  store: StoreInfo;
  settings: SettingValues;
  document: ThemeDocument;
  data: HomeData;
}) {
  const page = useMemo(
    () => (
      <StoreChrome>
        <ThemeRenderer document={document} data={data} />
      </StoreChrome>
    ),
    [document, data],
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const frameWidth = device === "desktop" ? 1280 : 390;

  useEffect(() => {
    const observer = new ResizeObserver(() => setSize({ width: box.current?.clientWidth ?? 0, height: content.current?.offsetHeight ?? 0 }));
    if (box.current) observer.observe(box.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  const available = device === "desktop" ? size.width : Math.min(size.width, 360);
  const scale = available ? available / frameWidth : 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-muted/40">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
        <span className="text-xs font-medium text-muted-foreground">Live preview</span>
        <div role="radiogroup" aria-label="Preview device" className="flex rounded-sm border p-0.5">
          {(["desktop", "mobile"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              aria-label={value === "desktop" ? "Desktop" : "Mobile"}
              onClick={() => setDevice(value)}
              className={cn("rounded-xs p-1 transition-colors", device === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {value === "desktop" ? <Monitor className="size-3.5" /> : <Smartphone className="size-3.5" />}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cn("mx-auto", device === "mobile" && "my-4 overflow-hidden rounded-[1.25rem] border-[6px] border-foreground")} style={{ width: available || undefined, height: size.height * scale || undefined }}>
          <div ref={content} inert style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: "top left", opacity: scale ? 1 : 0 }}>
            <StoreProvider store={store}>
              <StoreFrame settings={settings}>{page}</StoreFrame>
            </StoreProvider>
          </div>
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------- customizer

export function StoreCustomizer({
  initialProfile,
  initialBrand,
  themeId,
  themeName,
  document,
  data,
  store,
  welcome,
}: {
  initialProfile: StoreProfile;
  initialBrand: Brand;
  themeId: string;
  themeName: string;
  document: ThemeDocument;
  data: HomeData;
  store: Omit<StoreInfo, "profile" | "settings">;
  welcome: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [brand, setBrand] = useState(initialBrand);
  const [saved, setSaved] = useState({ profile: initialProfile, brand: initialBrand });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWelcome, setShowWelcome] = useState(welcome);
  const [pending, startTransition] = useTransition();
  // Memoized: the profile can hold a large uploaded logo, so don't re-serialise it on every color tick.
  const profileDirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(saved.profile), [profile, saved.profile]);
  const dirty = profileDirty || JSON.stringify(brand) !== JSON.stringify(saved.brand);

  // Dragging the native color picker fires dozens of events a second. `colorDraft`
  // updates instantly for the swatch/hex/button preview (cheap, local); the actual
  // `brand` commit (which re-renders the storefront preview) is debounced, so a
  // fast drag only triggers that heavier update once the user pauses or lets go.
  const [colorDraft, setColorDraft] = useState(initialBrand.colorPrimary);
  const [syncedColor, setSyncedColor] = useState(brand.colorPrimary);
  if (syncedColor !== brand.colorPrimary) {
    // brand.colorPrimary changed from outside a drag (swatch click, Discard): adopt it.
    setSyncedColor(brand.colorPrimary);
    setColorDraft(brand.colorPrimary);
  }
  const colorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(colorTimer.current), []);
  const commitColor = useCallback((value: string, { immediate = false } = {}) => {
    setColorDraft(value);
    clearTimeout(colorTimer.current);
    const apply = () => setBrand((b) => ({ ...b, colorPrimary: value, colorPrimaryText: /^#[0-9a-f]{6}$/i.test(value) ? readableTextOn(value) : b.colorPrimaryText }));
    if (immediate) apply();
    else colorTimer.current = setTimeout(apply, 120);
  }, []);

  const set = useCallback(<K extends keyof StoreProfile>(key: K, value: StoreProfile[K]) => setProfile((p) => ({ ...p, [key]: value })), []);
  const setNested = useCallback(
    <K extends "contact" | "social" | "announcement" | "checkout">(key: K, patch: Partial<StoreProfile[K]>) =>
      setProfile((p) => ({ ...p, [key]: { ...p[key], ...patch } })),
    [],
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    const parsed = StoreProfileSchema.safeParse(profile);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      toast.error("Check the highlighted fields");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveStoreDesignAction({ profile: parsed.data, themeId, brand });
      if (!result?.data) {
        toast.error("Couldn't save your changes", { description: result?.serverError ?? "Please try again." });
        return;
      }
      setSaved({ profile: result.data.profile, brand });
      setProfile(result.data.profile);
      toast.success("Your store is updated", { description: "Changes are live now." });
      router.refresh();
    });
  }

  // Preview performance: brand color/fonts are CSS variables, applied
  // instantly without re-rendering the storefront (see LivePreview). Profile
  // edits re-render it, so they're deferred: typing stays responsive.
  const previewProfile = useDeferredValue(profile);
  const previewStore = useMemo<StoreInfo>(
    () => ({ ...store, profile: previewProfile, settings: document.settings }),
    [store, document, previewProfile],
  );
  const previewSettings = useMemo(() => ({ ...document.settings, ...brand }), [document, brand]);
  const linkOptions = useMemo(() => [
    { value: "/products", label: "All products" },
    { value: "/products?collection=new-arrivals", label: "New arrivals" },
    { value: "/products?collection=best-sellers", label: "Best sellers" },
    { value: "/products?collection=sale", label: "Sale" },
    { value: "/categories", label: "All categories" },
    { value: "/brands", label: "Brands" },
    ...data.categories.map((c) => ({ value: `/categories/${c.slug}`, label: `Category: ${c.name}` })),
  ], [data.categories]);

  // Form sections that don't depend on the brand are memoized, so dragging the
  // color picker re-renders only the brand controls and the preview frame.
  const identityGroups = useMemo(
    () => (
      <>
        <Group id="store" title="Store details" description="How your store introduces itself.">
          <Row label="Store name" htmlFor="name" error={errors.name}>
            <Input id="name" value={profile.name} onChange={(e) => set("name", e.target.value)} maxLength={60} />
          </Row>
          <Row label="Tagline" htmlFor="tagline" error={errors.tagline} hint="Shown in your footer and in search results.">
            <Input id="tagline" value={profile.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={140} />
          </Row>
        </Group>
    
        <Group id="logo" title="Logo & icon" description="Without a logo, your store name is shown in the theme's heading font.">
          <Row label="Logo" htmlFor="logo-input" error={errors.logo}>
            <ImageField id="logo-input" value={profile.logo} onChange={(url) => set("logo", url)} maxSize={600} hint="PNG or SVG-style logos with a transparent background look best." />
          </Row>
          <Row label="Browser icon (favicon)" htmlFor="favicon-input" error={errors.favicon}>
            <ImageField id="favicon-input" value={profile.favicon} onChange={(url) => set("favicon", url)} maxSize={128} previewClassName="w-16" emptyLabel="Upload a square image" hint="A square image, at least 64 × 64 px." />
          </Row>
        </Group>
      </>
    ),
    [profile, errors, set],
  );
  const detailGroups = useMemo(
    () => (
      <>
        <Group id="announcement" title="Announcement bar" description="A short message across the top of every page.">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="announcement-enabled">Show announcement</Label>
            <Switch id="announcement-enabled" checked={profile.announcement.enabled} onCheckedChange={(enabled) => setNested("announcement", { enabled })} />
          </div>
          {profile.announcement.enabled && (
            <>
              <Row label="Message" htmlFor="announcement-text" error={errors["announcement.text"]}>
                <Input id="announcement-text" value={profile.announcement.text} onChange={(e) => setNested("announcement", { text: e.target.value })} maxLength={140} placeholder="Free shipping on orders over $75" />
              </Row>
              <Row label="Link (optional)" htmlFor="announcement-link" error={errors["announcement.link"]}>
                <Select value={linkOptions.some((o) => o.value === profile.announcement.link) ? profile.announcement.link : "none"} onValueChange={(value) => setNested("announcement", { link: value === "none" ? "" : value })}>
                  <SelectTrigger id="announcement-link" className="w-full">
                    <SelectValue placeholder="No link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    {linkOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
        </>
      )}
    </Group>
    
    <Group id="menu" title="Main menu" description="The links in your header. Up to 8.">
      <ul className="space-y-2">
        {profile.navigation.map((link, index) => (
          <li key={index} className="flex items-center gap-2">
            <Input aria-label="Link label" value={link.label} onChange={(e) => set("navigation", profile.navigation.map((l, i) => (i === index ? { ...l, label: e.target.value } : l)))} className="w-32 shrink-0" maxLength={30} />
            <Select value={linkOptions.some((o) => o.value === link.href) ? link.href : link.href} onValueChange={(href) => set("navigation", profile.navigation.map((l, i) => (i === index ? { ...l, href } : l)))}>
              <SelectTrigger aria-label="Link destination" className="min-w-0 flex-1">
                <SelectValue>{linkOptions.find((o) => o.value === link.href)?.label ?? link.href}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {linkOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex shrink-0">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => { const next = [...profile.navigation]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; set("navigation", next); }}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={index === profile.navigation.length - 1} onClick={() => { const next = [...profile.navigation]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; set("navigation", next); }}>
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => set("navigation", profile.navigation.filter((_, i) => i !== index))}>
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {errors.navigation && <p className="text-xs text-destructive">{errors.navigation}</p>}
      <Button type="button" variant="outline" size="sm" disabled={profile.navigation.length >= 8} onClick={() => set("navigation", [...profile.navigation, { label: "New link", href: "/products" }])}>
        <Plus /> Add link
      </Button>
    </Group>
    
    <Group id="contact" title="Contact details" description="Shown in your footer so customers can reach you.">
      <Row label="Email" htmlFor="contact-email" error={errors["contact.email"]}>
        <Input id="contact-email" type="email" value={profile.contact.email} onChange={(e) => setNested("contact", { email: e.target.value })} placeholder="hello@yourstore.com" />
      </Row>
      <Row label="Phone" htmlFor="contact-phone" error={errors["contact.phone"]}>
        <Input id="contact-phone" type="tel" value={profile.contact.phone} onChange={(e) => setNested("contact", { phone: e.target.value })} />
      </Row>
      <Row label="Address" htmlFor="contact-address" error={errors["contact.address"]}>
        <Textarea id="contact-address" rows={2} value={profile.contact.address} onChange={(e) => setNested("contact", { address: e.target.value })} />
      </Row>
    </Group>
    
    <Group id="social" title="Social accounts" description="Icons appear in your footer for every account you add.">
      {SOCIAL_FIELDS.map((field) => (
        <Row key={field.key} label={field.label} htmlFor={`social-${field.key}`} error={errors[`social.${field.key}`]}>
          <Input id={`social-${field.key}`} value={profile.social[field.key]} onChange={(e) => setNested("social", { [field.key]: e.target.value })} placeholder={field.placeholder} />
        </Row>
      ))}
    </Group>
    
    <Group id="settings" title="Store settings" description="Currency and delivery pricing shown to shoppers.">
      <Row label="Currency" htmlFor="currency">
        <Select value={profile.currency} onValueChange={(value) => set("currency", value as StoreProfile["currency"])}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue>{profile.currency}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <div className="grid grid-cols-3 gap-3">
        <Row label="Free shipping over" htmlFor="free-shipping" error={errors["checkout.freeShippingThreshold"]}>
          <Input id="free-shipping" type="number" min={0} value={profile.checkout.freeShippingThreshold} onChange={(e) => setNested("checkout", { freeShippingThreshold: Number(e.target.value) })} />
        </Row>
        <Row label="Standard rate" htmlFor="standard-rate">
          <Input id="standard-rate" type="number" min={0} step="0.5" value={profile.checkout.standardRate} onChange={(e) => setNested("checkout", { standardRate: Number(e.target.value) })} />
        </Row>
        <Row label="Express rate" htmlFor="express-rate">
          <Input id="express-rate" type="number" min={0} step="0.5" value={profile.checkout.expressRate} onChange={(e) => setNested("checkout", { expressRate: Number(e.target.value) })} />
        </Row>
      </div>
    </Group>
      </>
    ),
    [profile, errors, set, setNested, linkOptions],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-8">
        <AnimatePresence>
          {showWelcome && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="relative rounded-md border border-success/30 bg-success/5 p-4">
              <button type="button" aria-label="Dismiss" onClick={() => setShowWelcome(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
              <p className="flex items-center gap-2 font-medium">
                <PartyPopper className="size-4" /> {themeName} is live
              </p>
              <p className="mt-1 pr-6 text-sm text-muted-foreground">
                Your store is ready to sell. Add your logo and brand color below, and it&apos;ll feel like yours in a couple of minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {identityGroups}

        <Group id="brand" title="Brand color & fonts" description="Your color is used for buttons, links and highlights.">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color}`}
                  aria-pressed={colorDraft.toLowerCase() === color}
                  onClick={() => commitColor(color, { immediate: true })}
                  className="relative size-8 rounded-full ring-1 ring-foreground/10 transition-transform hover:scale-110"
                  style={{ background: color }}
                >
                  {colorDraft.toLowerCase() === color && <Check className="absolute inset-0 m-auto size-4" style={{ color: readableTextOn(color) }} />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-foreground/10" style={{ background: colorDraft }}>
                <span className="sr-only">Custom color</span>
                <input
                  type="color"
                  value={colorDraft}
                  onChange={(e) => commitColor(e.target.value)}
                  // The final value while dragging is debounced; committing on
                  // release/close keeps the picker itself from ever waiting on it.
                  onBlur={(e) => commitColor(e.target.value, { immediate: true })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <Input
                aria-label="Brand color hex"
                value={colorDraft}
                onChange={(e) => commitColor(e.target.value.trim())}
                onBlur={(e) => commitColor(e.target.value.trim(), { immediate: true })}
                className="w-32 font-mono"
              />
              <span className="rounded-sm px-3 py-1.5 text-sm font-medium" style={{ background: colorDraft, color: readableTextOn(colorDraft) }}>
                Button
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Fonts</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Font pairing">
              {FONT_PAIRINGS.map((pairing) => {
                const active = brand.fontHeading === pairing.heading && brand.fontBody === pairing.body;
                return (
                  <button
                    key={pairing.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setBrand((b) => ({ ...b, fontHeading: pairing.heading, fontBody: pairing.body }))}
                    className={cn("rounded-md border p-3 text-left transition-colors", active ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30")}
                  >
                    <span className="block text-2xl leading-none" style={{ fontFamily: FONTS[pairing.heading].stack }}>
                      Aa
                    </span>
                    <span className="mt-2 block text-sm font-medium">{pairing.label}</span>
                    <span className="block text-xs text-muted-foreground" style={{ fontFamily: FONTS[pairing.body].stack }}>
                      {FONTS[pairing.heading].label} · {FONTS[pairing.body].label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Group>

        {detailGroups}

        <div className="rounded-md border bg-card p-5">
          <p className="flex items-center gap-2 font-medium">
            <LayoutTemplate className="size-4" /> Want deeper control?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The theme builder lets you add, remove and reorder home page sections, edit banners and fine-tune every color and spacing. Totally optional.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-3">
            <Link href={THEME_ROUTES.editor(themeId)}>Open the theme builder</Link>
          </Button>
        </div>

        <AnimatePresence>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-md border bg-background p-3 shadow-lg"
            >
              <span className="pl-1 text-sm text-muted-foreground">Unsaved changes</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setProfile(saved.profile);
                    setBrand(saved.brand);
                    setErrors({});
                  }}
                >
                  Discard
                </Button>
                <Button size="sm" disabled={pending} onClick={save}>
                  {pending && <Spinner />} Save
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6 flex h-[calc(100dvh-3.5rem-3rem)] flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Theme: <span className="font-medium text-foreground">{themeName}</span>
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link href={THEME_ROUTES.storefront(store.slug)} target="_blank">
                View store <ExternalLink />
              </Link>
            </Button>
          </div>
          <LivePreview store={previewStore} settings={previewSettings} document={document} data={data} />
        </div>
      </div>
    </div>
  );
}
