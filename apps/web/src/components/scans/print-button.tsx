"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/provider";

export function PrintButton() {
  const t = useTranslations("scans");
  return (
    <Button type="button" onClick={() => window.print()} className="no-print">
      {t("print.printButton")}
    </Button>
  );
}
