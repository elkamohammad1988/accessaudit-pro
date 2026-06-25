import { scoreFromTotals, sumTotals, type ImpactTotals, type ScanStatus } from "@accessaudit/shared";
import type { ReportPage, ReportViewProps } from "@/components/scans/report-view";
import type { GroupedViolation } from "@/lib/report";

/**
 * A realistic, fully-static sample audit used by the public /sample page so
 * prospects can see the exact deliverable before signing up. Numbers are derived
 * from the canonical scoring helpers (scoreFromTotals/sumTotals), so the demo can
 * never drift from how real scans are scored. The target site uses the reserved
 * `.example` TLD — it is not a real site.
 */

const HOME = "https://www.northwind-coffee.example/";
const CONTACT = "https://www.northwind-coffee.example/contact";

const homeTotals: ImpactTotals = { critical: 1, serious: 2, moderate: 2, minor: 1 };
const contactTotals: ImpactTotals = { critical: 1, serious: 1, moderate: 0, minor: 1 };

const SAMPLE_PAGES: ReportPage[] = [
  {
    url: HOME,
    status: "ok",
    httpStatus: 200,
    score: scoreFromTotals(homeTotals),
    totals: homeTotals,
  },
  {
    url: CONTACT,
    status: "ok",
    httpStatus: 200,
    score: scoreFromTotals(contactTotals),
    totals: contactTotals,
  },
];

const SAMPLE_TOTALS = sumTotals([homeTotals, contactTotals]);

const DEQUE = (rule: string) => `https://dequeuniversity.com/rules/axe/4.10/${rule}`;

const SAMPLE_GROUPS: GroupedViolation[] = [
  {
    ruleId: "image-alt",
    impact: "critical",
    wcagCriteria: ["1.1.1"],
    description: "Images must have alternative text so screen-reader users know what they convey.",
    helpText: "Ensures <img> elements have alternate text or a role of none or presentation.",
    helpUrl: DEQUE("image-alt"),
    nodeCount: 3,
    occurrences: [
      {
        pageUrl: HOME,
        nodes: [
          {
            target: ["img.hero-banner"],
            html: '<img class="hero-banner" src="/img/hero.jpg">',
            failureSummary:
              "Fix any of the following:\n  Element does not have an alt attribute\n  Element has no title attribute",
          },
          {
            target: [".gallery > img:nth-child(2)"],
            html: '<img src="/img/roast-2.jpg">',
            failureSummary: "Fix any of the following:\n  Element does not have an alt attribute",
          },
        ],
      },
      {
        pageUrl: CONTACT,
        nodes: [
          {
            target: ["img.map-pin"],
            html: '<img class="map-pin" src="/img/pin.svg">',
            failureSummary: "Fix any of the following:\n  Element does not have an alt attribute",
          },
        ],
      },
    ],
  },
  {
    ruleId: "label",
    impact: "critical",
    wcagCriteria: ["1.3.1", "4.1.2"],
    description: "Every form field must have a programmatically associated label.",
    helpText: "Ensures every form element has a label.",
    helpUrl: DEQUE("label"),
    nodeCount: 2,
    occurrences: [
      {
        pageUrl: CONTACT,
        nodes: [
          {
            target: ["#email"],
            html: '<input id="email" type="email" placeholder="Email">',
            failureSummary:
              "Fix any of the following:\n  Form element does not have an implicit (wrapped) <label>\n  Form element does not have an explicit <label>",
          },
          {
            target: ["#message"],
            html: '<textarea id="message" placeholder="Your message"></textarea>',
            failureSummary:
              "Fix any of the following:\n  Form element does not have an explicit <label>",
          },
        ],
      },
    ],
  },
  {
    ruleId: "color-contrast",
    impact: "serious",
    wcagCriteria: ["1.4.3"],
    description:
      "Text must have sufficient contrast against its background to be readable by low-vision users.",
    helpText: "Ensures the contrast between foreground and background colors meets WCAG 2 AA.",
    helpUrl: DEQUE("color-contrast"),
    nodeCount: 5,
    occurrences: [
      {
        pageUrl: HOME,
        nodes: [
          {
            target: [".btn-primary"],
            html: '<a class="btn-primary" href="/order">Order now</a>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 2.71 (foreground #ffffff, background #9ad0c2, expected 4.5:1)",
          },
          {
            target: ["footer .muted"],
            html: '<span class="muted">© Northwind Coffee Co.</span>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 3.14 (expected 4.5:1)",
          },
          {
            target: ["nav a"],
            html: '<a href="/menu">Menu</a>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 3.98 (expected 4.5:1)",
          },
        ],
      },
      {
        pageUrl: CONTACT,
        nodes: [
          {
            target: [".form-hint"],
            html: '<p class="form-hint">We reply within one business day.</p>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 3.02 (expected 4.5:1)",
          },
          {
            target: [".btn-primary"],
            html: '<button class="btn-primary">Send</button>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 2.71 (expected 4.5:1)",
          },
        ],
      },
    ],
  },
  {
    ruleId: "link-name",
    impact: "serious",
    wcagCriteria: ["2.4.4", "4.1.2"],
    description: "Links must have discernible text so their purpose is clear out of context.",
    helpText: "Ensures links have discernible text.",
    helpUrl: DEQUE("link-name"),
    nodeCount: 2,
    occurrences: [
      {
        pageUrl: HOME,
        nodes: [
          {
            target: ["a.social-x"],
            html: '<a class="social-x" href="https://x.com/northwind"><svg>…</svg></a>',
            failureSummary:
              "Fix any of the following:\n  Element does not have text that is visible to screen readers\n  aria-label attribute does not exist or is empty",
          },
          {
            target: ["a.logo"],
            html: '<a class="logo" href="/"><img src="/img/logo.svg"></a>',
            failureSummary:
              "Fix any of the following:\n  Element has no discernible text (image inside link has no alt)",
          },
        ],
      },
    ],
  },
  {
    ruleId: "heading-order",
    impact: "moderate",
    wcagCriteria: ["1.3.1"],
    description: "Heading levels should only increase by one to keep a logical document outline.",
    helpText: "Ensures the order of headings is semantically correct.",
    helpUrl: DEQUE("heading-order"),
    nodeCount: 1,
    occurrences: [
      {
        pageUrl: HOME,
        nodes: [
          {
            target: ["h4.section-title"],
            html: '<h4 class="section-title">Our roasts</h4>',
            failureSummary: "Fix any of the following:\n  Heading order invalid (h2 skipped to h4)",
          },
        ],
      },
    ],
  },
  {
    ruleId: "region",
    impact: "moderate",
    wcagCriteria: ["1.3.1"],
    description: "All page content should sit inside a landmark so assistive tech can navigate it.",
    helpText: "Ensures all page content is contained by landmarks.",
    helpUrl: DEQUE("region"),
    nodeCount: 1,
    occurrences: [
      {
        pageUrl: HOME,
        nodes: [
          {
            target: [".promo-bar"],
            html: '<div class="promo-bar">Free shipping over $40</div>',
            failureSummary: "Fix any of the following:\n  Some page content is not contained by landmarks",
          },
        ],
      },
    ],
  },
];

/** Props ready to spread into <ReportView />. */
export const SAMPLE_REPORT: ReportViewProps = {
  status: "completed" as ScanStatus,
  score: scoreFromTotals(SAMPLE_TOTALS),
  totals: SAMPLE_TOTALS,
  wcagLevel: "AA",
  pagesScanned: 2,
  finishedAt: "2026-06-20T14:32:00.000Z",
  errorReason: null,
  pages: SAMPLE_PAGES,
  groups: SAMPLE_GROUPS,
};

/** Branding shown on the sample report header (a fictional agency + client). */
export const SAMPLE_BRAND = {
  agencyName: "Northwind Studio",
  clientName: "Northwind Coffee Co.",
  brandColor: "#4F46E5",
  date: "20 June 2026",
};
