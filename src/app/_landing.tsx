"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useMotionValue, useSpring, type Variants } from "framer-motion";
import {
  Package, ShoppingCart, Users, MessageSquare, Star, Paintbrush,
  ArrowRight, Check, ExternalLink,
} from "lucide-react";

// ─── Animation presets ────────────────────────────────────────────────────────

const up: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 50, stiffness: 200 });

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${Math.floor(v)}${suffix}`;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}


// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Paintbrush,
    title: "Theme builder",
    desc: "Pick a preset, change colours and fonts — your storefront is live in minutes. No code, no designer needed.",
  },
  {
    icon: MessageSquare,
    title: "Chat inbox",
    desc: "Facebook and Instagram DMs land in one inbox. Reply, resolve, and see order history without switching apps.",
  },
  {
    icon: ShoppingCart,
    title: "Orders & payments",
    desc: "Track from placement to delivery. Manage refunds, COD and online payments from one screen.",
  },
  {
    icon: Package,
    title: "Products & inventory",
    desc: "Variants, media, SEO, bulk-edit. Low-stock alerts. Everything your catalog needs.",
  },
  {
    icon: Star,
    title: "Reviews",
    desc: "Collect, moderate and display star ratings on your store. Build social proof automatically.",
  },
  {
    icon: Users,
    title: "Customers",
    desc: "Full purchase history, lifetime value, segments and loyalty discounts in one place.",
  },
];

// ─── Themes — clicking opens the real live demo store ─────────────────────────

const THEMES = [
  {
    id: "maison",
    name: "Maison",
    tagline: "Quiet luxury, every day.",
    desc: "Editorial fashion. Full-screen hero, hover image swap, portrait product cards.",
    tags: ["Fashion", "Jewelry"],
    palette: ["#faf8f5", "#efe9e1", "#1c1917"],
    photo: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=640&h=400&auto=format&fit=crop&q=80",
    headingStyle: "font-serif font-light tracking-tight",
    href: "/store/demo-maison",
  },
  {
    id: "volt",
    name: "Volt",
    tagline: "The tech you'll actually use.",
    desc: "Bold, conversion-focused. Dark header, high contrast, badge labels.",
    tags: ["Electronics", "Tech"],
    palette: ["#ffffff", "#0b1220", "#2563eb"],
    photo: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=640&h=400&auto=format&fit=crop&q=80",
    headingStyle: "font-black tracking-tighter",
    href: "/store/demo-volt",
  },
  {
    id: "petal",
    name: "Petal",
    tagline: "Clean skincare, beautifully simple.",
    desc: "Soft, airy and trustworthy. Warm tones, rounded shapes, gentle layouts.",
    tags: ["Beauty", "Skincare"],
    palette: ["#fdf8f5", "#f6e9e2", "#a05a4f"],
    photo: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=640&h=400&auto=format&fit=crop&q=80",
    headingStyle: "font-serif font-medium",
    href: "/store/demo-petal",
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

type Currency = "NPR" | "INR" | "USD";
type Billing  = "monthly" | "yearly";

const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  NPR: { symbol: "Rs.", label: "NPR" },
  INR: { symbol: "₹",   label: "INR" },
  USD: { symbol: "$",   label: "USD" },
};

const PLANS = [
  {
    name: "Starter",
    prices: {
      yearly:  { NPR: "15,000", INR: "9,500",  USD: "109" },
      monthly: { NPR: "1,800",  INR: "1,100",  USD: "13"  },
    },
    desc: "New stores getting off the ground.",
    featured: false,
    features: ["500 products", "All themes", "Orders & payments", "Customer management", "Email support"],
  },
  {
    name: "Growth",
    prices: {
      yearly:  { NPR: "25,000", INR: "15,500", USD: "179" },
      monthly: { NPR: "2,800",  INR: "1,800",  USD: "19"  },
    },
    desc: "Stores ready to scale.",
    featured: true,
    badge: "Most popular",
    features: ["2,000 products", "All themes", "Meta chat inbox", "Reviews & ratings", "Discounts & codes", "Priority support"],
  },
  {
    name: "Pro",
    prices: {
      yearly:  { NPR: "30,000", INR: "19,000", USD: "219" },
      monthly: { NPR: "3,500",  INR: "2,200",  USD: "25"  },
    },
    desc: "High-volume, full control.",
    featured: false,
    features: ["Unlimited products", "Everything in Growth", "Multi-staff access", "API access", "Dedicated onboarding", "Phone support"],
  },
  {
    name: "Custom",
    prices: null,
    desc: "Large businesses. Tailored to you.",
    featured: false,
    features: ["Everything in Pro", "Custom integrations", "SLA guarantee", "White-label option", "Dedicated account manager"],
  },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [currency, setCurrency] = useState<Currency>("NPR");
  const [billing, setBilling]   = useState<Billing>("yearly");
  const { symbol } = CURRENCY_META[currency];

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight shrink-0">
            <span className="size-7 bg-zinc-950 text-white flex items-center justify-center rounded text-xs font-bold">E</span>
            Ecom Engine
          </Link>
          <nav className="hidden md:flex items-center gap-5 ml-2">
            {[["Features", "#features"], ["Themes", "#themes"], ["Pricing", "#pricing"]].map(([l, h]) => (
              <a key={l} href={h} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{l}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="text-sm bg-zinc-950 text-white px-4 py-1.5 rounded hover:bg-zinc-800 transition-colors font-medium">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-100 overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-0 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={up} className="text-5xl sm:text-6xl lg:text-[72px] font-semibold tracking-tight leading-[1.04] mb-8 text-zinc-950">
              Everything you need<br />to sell online.
            </motion.h1>

            <motion.div variants={up} className="flex flex-wrap gap-3 justify-center">
              <Link href="/register" className="inline-flex items-center gap-2 bg-zinc-950 text-white px-7 py-3 rounded-md text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm">
                Create your store <ArrowRight className="size-4" />
              </Link>
              <a href="#themes" className="inline-flex items-center gap-2 border border-zinc-200 text-zinc-700 px-7 py-3 rounded-md text-sm font-semibold hover:border-zinc-400 hover:text-zinc-900 transition-colors">
                Browse themes
              </a>
            </motion.div>

            <motion.div variants={up} className="flex items-center justify-center gap-6 mt-7">
              {[
                { label: "No transaction fees" },
                { label: "99% uptime SLA" },
                { label: "Live in under an hour" },
              ].map(({ label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Check className="size-3 text-zinc-400" />
                  {label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Dashboard screenshot ── */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 relative"
          >
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.14)] mx-auto">
              <Image
                src="/screenshots/dashboard.png"
                alt="Ecom Engine dashboard"
                width={1440}
                height={750}
                className="w-full h-auto"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <div className="bg-zinc-50 border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-7 flex flex-wrap gap-x-10 gap-y-4 justify-center sm:justify-start">
          {[
            { label: "Active stores", to: 120, suffix: "+" },
            { label: "Orders processed", to: 50, suffix: "k+" },
            { label: "Theme presets", to: 4, suffix: "" },
            { label: "Uptime SLA", to: 99, suffix: "%" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-zinc-950 tabular-nums">
                <Counter to={stat.to} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12">
            <motion.p variants={up} className="text-xs uppercase tracking-widest text-zinc-400 mb-3">What you get</motion.p>
            <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-md">
              Every tool. One dashboard. Nothing extra to install.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-100"
          >
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={up}
                className="bg-white p-8 hover:bg-zinc-50 transition-colors"
              >
                <Icon className="size-5 text-zinc-900 mb-4 stroke-[1.5]" />
                <h3 className="text-sm font-semibold text-zinc-900 mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── THEME BUILDER ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={up} className="text-xs uppercase tracking-widest text-zinc-400 mb-4">Theme engine</motion.p>
            <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight mb-5">
              Design your storefront.<br />Launch in minutes.
            </motion.h2>
            <motion.p variants={up} className="text-zinc-500 mb-8 leading-relaxed">
              Pick from professionally designed presets, then customise colours, fonts and layout with live preview. When it looks right, publish with one click — your store goes live instantly.
            </motion.p>
            <motion.ul variants={stagger} className="space-y-3 mb-8">
              {[
                "4 fully-designed presets for different industries.",
                "Colour, font, button shape and layout — all editable.",
                "Live preview on desktop and mobile side-by-side.",
                "Publish instantly. Revert anytime.",
              ].map(b => (
                <motion.li key={b} variants={up} className="flex items-start gap-3 text-sm text-zinc-600">
                  <Check className="size-4 mt-0.5 text-zinc-900 shrink-0" />
                  {b}
                </motion.li>
              ))}
            </motion.ul>
            <motion.div variants={up}>
              <a href="#themes" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 group">
                Browse themes <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-lg shadow-zinc-100">
              <Image
                src="/screenshots/theme-editor.png"
                alt="Theme builder editor"
                width={1440}
                height={752}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CHAT INBOX ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-lg shadow-zinc-100">
              <Image
                src="/screenshots/chat.png"
                alt="Chat inbox — Messenger and Instagram messages in one place"
                width={1440}
                height={750}
                className="w-full h-auto"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="order-1 lg:order-2"
          >
            <motion.p variants={up} className="text-xs uppercase tracking-widest text-zinc-400 mb-4">Customer messaging</motion.p>
            <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight mb-5">
              Facebook + Instagram,<br />one inbox.
            </motion.h2>
            <motion.p variants={up} className="text-zinc-500 mb-8 leading-relaxed">
              Every DM from Facebook and Instagram lands in one place. See the customer&apos;s order history, assign threads, and reply — without switching between apps.
            </motion.p>
            <motion.ul variants={stagger} className="space-y-3">
              {[
                "Meta (Facebook + Instagram) messages unified.",
                "Customer order history shown in the sidebar.",
                "Mark conversations resolved to keep the queue clean.",
                "Works on mobile — reply from anywhere.",
              ].map(b => (
                <motion.li key={b} variants={up} className="flex items-start gap-3 text-sm text-zinc-600">
                  <Check className="size-4 mt-0.5 text-zinc-900 shrink-0" />
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </section>

      {/* ── THEMES ──────────────────────────────────────────── */}
      <section id="themes" className="py-20 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12">
            <motion.p variants={up} className="text-xs uppercase tracking-widest text-zinc-400 mb-3">Theme store</motion.p>
            <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-md">
              Your brand, ready out of the box.
            </motion.h2>
            <motion.p variants={up} className="text-zinc-500 mt-4 max-w-md leading-relaxed text-sm">
              Every theme is a complete storefront — home, catalog, product pages, cart and checkout. Pick one and start selling. Click to preview it live.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {THEMES.map((theme) => (
              <motion.div key={theme.id} variants={up} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <Link
                  href={theme.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-zinc-200 rounded-xl overflow-hidden bg-white hover:border-zinc-400 hover:shadow-md transition-all"
                >
                  <div className="relative h-52 overflow-hidden bg-zinc-100">
                    <Image
                      src={theme.photo}
                      alt={theme.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent flex flex-col justify-end p-4">
                      <p className={`text-white text-lg mb-2 ${theme.headingStyle}`}>{theme.tagline}</p>
                      <div className="flex gap-1.5">
                        {theme.palette.map((c, i) => (
                          <span key={i} className="size-3.5 rounded-full border border-white/40" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{theme.name}</span>
                      <div className="flex gap-1">
                        {theme.tags.map(t => (
                          <span key={t} className="text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-3">{theme.desc}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      <ExternalLink className="size-3" />
                      View live demo
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="mt-6 text-xs text-zinc-400">+1 more theme in the library. All themes free with every plan.</p>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12">
            <motion.p variants={up} className="text-xs uppercase tracking-widest text-zinc-400 mb-3">Pricing</motion.p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Simple pricing. No surprises.
                </motion.h2>
                <motion.p variants={up} className="text-zinc-500 mt-4 max-w-md text-sm leading-relaxed">
                  Every plan includes the storefront, all themes and all dashboard features. Monthly billing, cancel anytime.
                </motion.p>
              </div>
              <motion.div variants={up} className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Billing toggle */}
                <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                  {(["monthly", "yearly"] as Billing[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBilling(b)}
                      className={`relative px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                        billing === b
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      {b}
                      {b === "yearly" && (
                        <span className="ml-1.5 text-[10px] font-bold text-green-600">Save 20%</span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Currency toggle */}
                <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                  {(["NPR", "INR", "USD"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        currency === c
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={up}
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.featured
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 hover:border-zinc-300 transition-colors"
                }`}
              >
                {"badge" in plan && plan.badge && (
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-4 w-fit ${
                    plan.featured ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}>{plan.badge}</span>
                )}
                <div className="text-base font-semibold mb-1">{plan.name}</div>
                <p className={`text-xs leading-relaxed mb-5 ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>{plan.desc}</p>
                {plan.prices ? (
                  <>
                    <div className="text-2xl font-semibold tracking-tight mb-0.5">
                      {symbol}{plan.prices[billing][currency]}
                    </div>
                    <div className={`text-xs mb-6 ${plan.featured ? "text-zinc-500" : "text-zinc-400"}`}>
                      per {billing === "yearly" ? "year" : "month"} · {currency}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-semibold tracking-tight mb-0.5">Let&apos;s talk</div>
                    <div className={`text-xs mb-6 ${plan.featured ? "text-zinc-500" : "text-zinc-400"}`}>tailored to you</div>
                  </>
                )}
                <div className={`h-px mb-5 ${plan.featured ? "bg-zinc-800" : "bg-zinc-100"}`} />
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${plan.featured ? "text-zinc-300" : "text-zinc-600"}`}>
                      <Check className={`size-3.5 mt-0.5 shrink-0 ${plan.featured ? "text-white" : "text-zinc-900"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 block text-center py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    plan.featured
                      ? "bg-white text-zinc-950 hover:bg-zinc-100"
                      : plan.prices === null
                      ? "bg-zinc-950 text-white hover:bg-zinc-800"
                      : "border border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {plan.prices === null ? "Contact us" : "Get started"}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="mt-5 text-xs text-zinc-400">Annual billing saves ~20% vs monthly. Exclusive of applicable taxes. No setup fee. No transaction fee.</p>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────────────────────── */}
      <div className="bg-zinc-50 border-b border-zinc-100 py-14 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { title: "Secure by default",   desc: "HTTPS everywhere, httpOnly cookies, role-based access on every screen." },
            { title: "99% uptime SLA",      desc: "Hosted on AWS with auto-scaling. Your store stays on when customers shop." },
            { title: "Go live today",       desc: "Register, pick a theme, add products — your store is live in under an hour." },
            { title: "Grows with you",      desc: "Upgrade your plan as orders increase. No re-platforming needed." },
          ].map((t) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
            >
              <div className="text-sm font-semibold text-zinc-900 mb-2">{t.title}</div>
              <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-xl">
            <motion.h2 variants={up} className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Your store is one step away.
            </motion.h2>
            <motion.p variants={up} className="text-zinc-500 mb-8 leading-relaxed">
              Create your account, pick a theme, and start selling. No credit card required.
            </motion.p>
            <motion.div variants={up} className="flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 bg-zinc-950 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors">
                Create your store <ArrowRight className="size-4" />
              </Link>
              <a href="#pricing" className="inline-flex items-center gap-2 border border-zinc-200 text-zinc-600 px-6 py-3 rounded-md text-sm font-medium hover:border-zinc-400 hover:text-zinc-900 transition-colors">
                View pricing
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-zinc-50 border-t border-zinc-100 px-6 py-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 mb-4">
              <span className="size-7 bg-zinc-950 text-white flex items-center justify-center rounded text-xs font-bold">E</span>
              Ecom Engine
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Admin dashboard and storefront builder for every kind of online store. Managed, hosted, always on.
            </p>
          </div>
          {[
            { label: "Product", links: [["Features", "#features"], ["Themes", "#themes"], ["Pricing", "#pricing"], ["Changelog", "#"]] },
            { label: "Company", links: [["About", "#"], ["Blog", "#"], ["Careers", "#"], ["Contact", "#"]] },
            { label: "Legal",   links: [["Privacy policy", "#"], ["Terms of service", "#"], ["Refund policy", "#"]] },
          ].map(({ label, links }) => (
            <div key={label}>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-4">{label}</div>
              <ul className="space-y-3">
                {links.map(([name, href]) => (
                  <li key={name}><a href={href} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">{name}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between items-center pt-8 border-t border-zinc-200 gap-3">
          <p className="text-xs text-zinc-400">© 2026 Ecom Engine. All rights reserved.</p>
          <p className="text-xs text-zinc-400">Built in Nepal 🇳🇵</p>
        </div>
      </footer>
    </div>
  );
}
