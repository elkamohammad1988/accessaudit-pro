"use client";

import { useState } from "react";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  type BillingInterval,
  type PlanTier,
  formatLimit,
  priceForInterval,
  yearlySavings,
} from "@accessaudit/shared";
import { startCheckout } from "@/app/(app)/settings/billing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Plan selection grid with a monthly/annual billing toggle. Annual is shown only
 * when the operator has configured annual Stripe prices (`annualAvailable`).
 * Choosing a plan posts the selected `interval` to the `startCheckout` action.
 */
export function PlanGrid({
  actualPlan,
  hasPaid,
  annualAvailable,
}: {
  actualPlan: PlanTier;
  hasPaid: boolean;
  annualAvailable: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>(annualAvailable ? "yearly" : "monthly");
  const yearly = interval === "yearly";

  return (
    <section aria-label="Plans" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Plans</h2>
        {annualAvailable ? (
          <div
            role="group"
            aria-label="Billing interval"
            className="inline-flex items-center rounded-lg border bg-card p-0.5 text-sm"
          >
            <button
              type="button"
              aria-pressed={!yearly}
              onClick={() => setInterval("monthly")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                !yearly ? "bg-brand text-brand-fg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setInterval("yearly")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                yearly ? "bg-brand text-brand-fg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual <span className="text-xs opacity-90">· 2 months free</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_TIERS.map((tier) => {
          const p = PLAN_LIMITS[tier];
          const isCurrent = tier === actualPlan;
          const price = priceForInterval(tier, interval);
          const isFree = p.priceMonthly === 0;
          return (
            <Card
              key={tier}
              className={`flex flex-col p-5 ${isCurrent ? "border-brand ring-1 ring-brand" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.label}</p>
                {isCurrent ? <Badge>Current</Badge> : null}
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                ${price}
                <span className="text-sm font-normal text-muted-foreground">
                  {isFree ? "" : yearly ? "/yr" : "/mo"}
                </span>
              </p>
              {!isFree && yearly ? (
                <p className="mt-0.5 text-xs font-medium text-success-strong">
                  Save ${yearlySavings(tier)} a year
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">&nbsp;</p>
              )}
              <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
                <li>{formatLimit(p.clients)} clients</li>
                <li>{formatLimit(p.projects)} projects</li>
                <li>{formatLimit(p.scansPerMonth)} scans/mo</li>
                <li>{formatLimit(p.pagesPerScan)} pages/scan</li>
                <li>{p.whiteLabelPdf ? "White-label PDF" : "No white-label"}</li>
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="text-xs text-muted-foreground">Your plan</span>
                ) : isFree ? (
                  hasPaid ? (
                    <span className="text-xs text-muted-foreground">Downgrade via portal</span>
                  ) : null
                ) : hasPaid ? (
                  <span className="text-xs text-muted-foreground">Switch via portal</span>
                ) : (
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value={tier} />
                    <input type="hidden" name="interval" value={interval} />
                    <Button type="submit" size="sm" className="w-full">
                      Choose {p.label}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Limits are enforced as you create clients, projects, and scans.{" "}
        {annualAvailable ? "Billed monthly or annually" : "Billed monthly"} via Stripe. Workspaces are
        single-user in this release — team seats are on the roadmap.
      </p>
    </section>
  );
}
