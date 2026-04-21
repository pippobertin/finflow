"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { StepOrganization } from "./step-organization";
import { StepBankAccount } from "./step-bank-account";
import { StepEcAnnual } from "./step-ec-annual";
import { StepEcQuarterly } from "./step-ec-quarterly";
import { StepMovements } from "./step-movements";
import { StepInvoices } from "./step-invoices";
const STEPS = [
  { id: 0, title: "Organizzazione", description: "Dati aziendali" },
  { id: 1, title: "Conto Bancario", description: "Nome banca e IBAN" },
  { id: 2, title: "EC Annuale", description: "Saldo fine anno" },
  { id: 3, title: "EC Trimestrali", description: "Saldi trimestrali" },
  { id: 4, title: "Movimenti", description: "Importa CSV" },
  { id: 5, title: "Fatture", description: "Fatture XML/CSV" },
];

export function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.onboardingCompleted) {
          router.push("/overview");
          return;
        }
        setOrgData(data);
        if (typeof data.onboardingStep === "number" && data.onboardingStep > 0) {
          setCurrentStep(Math.min(data.onboardingStep, STEPS.length - 1));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleComplete = useCallback(() => {
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "complete", data: {} }),
    }).then(() => router.push("/overview"));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const stepProps = {
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleSkip,
    orgData,
    setOrgData,
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    idx < currentStep
                      ? "bg-emerald-500 text-white"
                      : idx === currentStep
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
                  )}
                >
                  {idx < currentStep ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    idx <= currentStep ? "text-slate-700 dark:text-slate-300" : "text-slate-400",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-8 sm:w-12 lg:w-16",
                    idx < currentStep ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {currentStep === 0 && <StepOrganization {...stepProps} />}
        {currentStep === 1 && <StepBankAccount {...stepProps} />}
        {currentStep === 2 && <StepEcAnnual {...stepProps} />}
        {currentStep === 3 && <StepEcQuarterly {...stepProps} />}
        {currentStep === 4 && <StepMovements {...stepProps} />}
        {currentStep === 5 && <StepInvoices {...stepProps} onNext={handleComplete} />}
      </div>
    </div>
  );
}
