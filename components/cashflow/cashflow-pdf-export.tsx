"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";
import { SCENARIO_PRESETS } from "@/lib/cashflow/scenario-engine";

interface CashflowPdfExportProps {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function CashflowPdfExport({ chartContainerRef }: CashflowPdfExportProps) {
  const { scenario } = useCashflowSettings();

  const handleExport = useCallback(async () => {
    if (!chartContainerRef.current) return;

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas-pro"),
    ]);

    const canvas = await html2canvas(chartContainerRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");

    // Header
    const now = new Date().toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    pdf.setFontSize(16);
    pdf.text("FinFlow — Previsione Cashflow", 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Scenario: ${SCENARIO_PRESETS[scenario].label} | Data: ${now}`, 14, 22);

    // Chart image
    const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 14, 28, pdfWidth, Math.min(pdfHeight, 160));

    pdf.save("previsione-cashflow.pdf");
  }, [chartContainerRef, scenario]);

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Esporta PDF
    </Button>
  );
}
