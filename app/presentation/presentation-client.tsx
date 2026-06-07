"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Layers,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Printer,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

export type PresentationDeck = {
  deck_metadata: {
    title: string;
    subtitle: string;
    version: string;
    language: string;
    audience: string;
    tone: string;
    duration_estimate_minutes: number;
    created_for: string;
    source_project: string;
    recommended_format: string;
    design_style: {
      visual_personality: string;
      color_direction: string;
      typography_direction: string;
      layout_direction: string;
    };
  };
  slide_generation_rules: Record<string, JsonValue>;
  slides: Slide[];
  closing_message_for_presenter: string;
};

type Slide = {
  id: number;
  section: string;
  title: string;
  subtitle: string;
  content_blocks: ContentBlock[];
  speaker_notes: string;
  visual_direction: string;
};

type ContentBlock = {
  type: string;
  heading?: string;
  body?: string;
  items?: JsonValue[];
  steps?: JsonValue[];
  columns?: string[];
  examples?: string[];
};

const sectionIcons: Record<string, React.ElementType> = {
  Opening: Presentation,
  Problem: BarChart3,
  Solution: Layers,
  "Product Overview": Layers,
  Architecture: Network,
  Workspace: Database,
  "Project Management": CheckCircle2,
  Execution: CheckCircle2,
  Milestones: BarChart3,
  Dashboard: BarChart3,
  Team: Users,
  "My Work": CheckCircle2,
  AI: Bot,
  "AI Automation": Sparkles,
  Risk: ShieldCheck,
  Reports: FileText,
  Integrations: RadioTower,
  "Data Flow": Network,
  Audit: ShieldCheck,
  Security: ShieldCheck,
  "Client Experience": Users,
  Demo: Presentation,
  Differentiation: Sparkles,
  "Business Value": BarChart3,
  "Implementation Readiness": CheckCircle2,
  "Future Roadmap": Layers,
  Closing: Sparkles,
  Appendix: FileText,
};

const accentBySection: Record<string, string> = {
  Problem: "bg-red-50 text-red-700 border-red-200",
  Solution: "bg-blue-50 text-blue-700 border-blue-200",
  Architecture: "bg-slate-50 text-slate-700 border-slate-200",
  AI: "bg-purple-50 text-purple-700 border-purple-200",
  "AI Automation": "bg-purple-50 text-purple-700 border-purple-200",
  Risk: "bg-amber-50 text-amber-800 border-amber-200",
  Integrations: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Security: "bg-slate-50 text-slate-700 border-slate-200",
  Closing: "bg-blue-50 text-blue-700 border-blue-200",
};

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: JsonValue): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-slate-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>{renderValue(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (isObject(value)) {
    const entries = Object.entries(value);
    return (
      <div className="grid gap-1.5">
        {entries.map(([key, nestedValue]) => (
          <div key={key} className="grid grid-cols-[88px_1fr] gap-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              {humanizeKey(key)}
            </div>
            <div className="text-[11px] font-semibold leading-snug text-slate-800">
              {renderValue(nestedValue)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return String(value ?? "");
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  const entries = block.items || block.steps || block.columns || block.examples || [];
  const heading = block.heading || humanizeKey(block.type);

  if (block.type === "solution_flow" || block.type === "flow_steps" || block.type === "demo_script") {
    const steps = block.steps || block.items || [];
    return (
      <div className="min-h-0 space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">{heading}</div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="flex min-h-[56px] gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                {index + 1}
              </div>
              <div className="line-clamp-3 text-[11px] font-semibold leading-snug text-slate-700">{renderValue(step)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "kanban_columns") {
    return (
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Workflow Kanban</div>
        <div className="grid grid-cols-3 gap-2">
          {(block.columns || []).map((column, index) => (
            <div key={column} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-[9px] font-black uppercase text-slate-400">Stage {index + 1}</div>
              <div className="mt-1 text-sm font-black text-slate-900">{column}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "role_matrix" || block.type === "integration_roles" || block.type === "architecture_stack" || block.type === "feature_grid") {
    return (
      <div className="min-h-0 space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">{heading}</div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
              {renderValue(item)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.body) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">{heading}</div>
        <p className="mt-1.5 text-[12px] font-semibold leading-snug text-slate-800">{block.body}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 space-y-2">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">{heading}</div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((item, index) => (
          <div key={index} className="flex min-h-[48px] gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="text-[11px] font-semibold leading-snug text-slate-700">{renderValue(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PresentationClient({
  deck,
  initialSlideIndex,
}: {
  deck: PresentationDeck;
  initialSlideIndex: number;
}) {
  const [activeIndex, setActiveIndex] = useState(initialSlideIndex);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        setActiveIndex((current) => Math.min(current + 1, deck.slides.length - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck.slides.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("slide", String(activeIndex + 1));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeIndex]);

  const slide = deck.slides[activeIndex];
  const SectionIcon = sectionIcons[slide.section] || Presentation;
  const progress = Math.round(((activeIndex + 1) / deck.slides.length) * 100);

  const sections = useMemo(() => {
    return Array.from(new Set(deck.slides.map((item) => item.section)));
  }, [deck.slides]);

  const goToSlide = (index: number) => {
    setActiveIndex(Math.min(Math.max(index, 0), deck.slides.length - 1));
    setMobileNavOpen(false);
  };

  const nav = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Presentation className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-950">{deck.deck_metadata.title}</div>
            <div className="text-xs font-bold text-slate-500">{deck.slides.length} slides</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          {sections.slice(0, 8).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => goToSlide(deck.slides.findIndex((item) => item.section === section))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {deck.slides.map((item, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-black uppercase ${active ? "text-blue-700" : "text-slate-400"}`}>
                    Slide {index + 1}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                    {item.section}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-black leading-snug text-slate-900">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white lg:flex"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-slate-950">Client Pitch Deck</div>
              <div className="text-xs font-bold text-slate-500">
                {slide.section} / Slide {activeIndex + 1} of {deck.slides.length}
              </div>
            </div>
          </div>

          <div className="hidden min-w-[240px] items-center gap-3 md:flex">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-black text-slate-500">{progress}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Print presentation"
            >
              <Printer className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className="h-full w-[86vw] max-w-sm border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-black uppercase">Slides</span>
              <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg border border-slate-200 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {sidebarOpen && (
          <aside className="hidden h-full w-[290px] shrink-0 border-r border-slate-200 lg:block">
            {nav}
          </aside>
        )}

        <main className="min-w-0 flex-1 overflow-hidden p-3 lg:p-4">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-3">
            <section className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex h-full flex-col p-4 md:p-5">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${accentBySection[slide.section] || "border-blue-200 bg-blue-50 text-blue-700"}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <SectionIcon className="h-3.5 w-3.5" />
                        {slide.section}
                      </span>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      {String(activeIndex + 1).padStart(2, "0")} / {String(deck.slides.length).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="mt-4 max-w-5xl">
                    <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
                      {slide.title}
                    </h1>
                    <p className="mt-2 max-w-4xl text-sm font-semibold leading-snug text-slate-600 md:text-base">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 grid min-h-0 gap-3 overflow-hidden lg:grid-cols-2">
                    {slide.content_blocks.map((block, index) => (
                      <div
                        key={`${slide.id}-${block.type}-${index}`}
                        className={slide.content_blocks.length === 1 ? "lg:col-span-2" : ""}
                      >
                        <BlockRenderer block={block} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex h-12 shrink-0 items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
                  {activeIndex + 1} / {deck.slides.length}
                </div>
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex + 1)}
                  disabled={activeIndex === deck.slides.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                disabled={activeIndex === deck.slides.length - 1}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
