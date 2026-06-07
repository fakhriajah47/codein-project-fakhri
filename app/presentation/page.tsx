import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { PresentationClient, PresentationDeck } from "./presentation-client";

export const metadata: Metadata = {
  title: "Client Pitch Presentation - Project Management Command Center",
  description: "Professional client pitch deck for the Project Management Command Center.",
};

function loadPresentationDeck(): PresentationDeck {
  const filePath = path.join(process.cwd(), "docs", "slide-presentation.md");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as PresentationDeck;
}

type PresentationPageProps = {
  searchParams?: Promise<{
    slide?: string;
  }>;
};

function resolveInitialSlide(slide: string | undefined, total: number) {
  const parsed = Number(slide);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed - 1, 0), total - 1);
}

export default async function PresentationPage({ searchParams }: PresentationPageProps) {
  const deck = loadPresentationDeck();
  const params = await searchParams;
  const initialSlideIndex = resolveInitialSlide(params?.slide, deck.slides.length);

  return <PresentationClient deck={deck} initialSlideIndex={initialSlideIndex} />;
}
