"use client";

import { useState } from "react";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  type BillingInterval,
  type PlanTier,
  priceForInterval,
  yearlySavings,
} from "@accessaudit/shared";
import { startCheckout } from "@/app/(app)/settings/billing/actions";
import { useTranslations } from "@/i18n/provider";
import { displayLimit } from "@/i18n/format";
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
  const t = useTranslations("billing");
  const tp = useTranslations("plans");
  const [interval, setInterval] = useState<BillingInterval>(annualAvailable ? "yearly" : "monthly");
  const yearly = interval === "yearly";

  return (
    <section aria-label={t("plan.heading")} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{t("plan.heading")}</h2>
        {annualAvailable ? (
          <div
            role="group"
            aria-label={t("plan.intervalGroup")}
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
              {t("plan.monthly")}
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setInterval("yearly")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                yearly ? "bg-brand text-brand-fg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("plan.annual")} <span className="text-xs opacity-90">{t("plan.annualNote")}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                {isCurrent ? <Badge>{t("plan.current")}</Badge> : null}
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                ${price}
                <span className="text-sm font-normal text-muted-foreground">
                  {isFree ? "" : yearly ? t("plan.perYear") : t("plan.perMonth")}
                </span>
              </p>
              {!isFree && yearly ? (
                <p className="mt-0.5 text-xs font-medium text-success-strong">
                  {t("plan.savePerYear", { amount: yearlySavings(tier) })}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">&nbsp;</p>
              )}
              <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
                <li>
                  {displayLimit(p.clients, tp)} {tp("rows.clients")}
                </li>
                <li>
                  {displayLimit(p.projects, tp)} {tp("rows.projects")}
                </li>
                <li>
                  {displayLimit(p.scansPerMonth, tp)} {tp("rows.scansPerMonth")}
                </li>
                <li>
                  {displayLimit(p.pagesPerScan, tp)} {tp("rows.pagesPerScan")}
                </li>
                <li>{p.whiteLabelPdf ? tp("rows.whiteLabelPdf") : t("plan.noWhiteLabel")}</li>
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="text-xs text-muted-foreground">{t("plan.yourPlan")}</span>
                ) : isFree ? (
                  hasPaid ? (
                    <span className="text-xs text-muted-foreground">
                      {t("plan.downgradeViaPortal")}
                    </span>
                  ) : null
                ) : hasPaid ? (
                  <span className="text-xs text-muted-foreground">{t("plan.switchViaPortal")}</span>
                ) : (
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value={tier} />
                    <input type="hidden" name="interval" value={interval} />
                    <Button type="submit" size="sm" className="w-full">
                      {t("plan.choose", { plan: p.label })}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {annualAvailable ? t("plan.footerAnnual") : t("plan.footerMonthly")}
      </p>
    </section>
  );
}
