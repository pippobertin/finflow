"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { ReconciliationClient } from "@/components/reconciliation/reconciliation-client";

export default function ReconciliationPage() {
  return (
    <>
      <Navbar title="Riconciliazione" />
      <div className="p-6">
        <ReconciliationClient />
      </div>
    </>
  );
}
