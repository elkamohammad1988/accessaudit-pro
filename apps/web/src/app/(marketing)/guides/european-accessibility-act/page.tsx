import type { Metadata } from "next";
import { GuideArticle, guideMetadata } from "@/components/marketing/guide-article";

const PATH = "/guides/european-accessibility-act";
const PUBLISHED = "2026-06-25";

export function generateMetadata(): Promise<Metadata> {
  return guideMetadata("eaa", PATH);
}

export default function EaaGuidePage() {
  return <GuideArticle slug="eaa" published={PUBLISHED} />;
}
