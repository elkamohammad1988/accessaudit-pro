import type { Metadata } from "next";
import { GuideArticle, guideMetadata } from "@/components/marketing/guide-article";

const PATH = "/guides/wcag-2-2-aa-checklist";
const PUBLISHED = "2026-06-25";

export function generateMetadata(): Promise<Metadata> {
  return guideMetadata("wcag", PATH);
}

export default function WcagChecklistPage() {
  return <GuideArticle slug="wcag" published={PUBLISHED} />;
}
