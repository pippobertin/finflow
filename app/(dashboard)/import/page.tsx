"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImportClient } from "@/components/import/import-client";
import { BankStatementImportClient } from "@/components/import/bank-statement-import-client";
import { FatturapaImportClient } from "@/components/import/fatturapa-import-client";

export default function ImportPage() {
  return (
    <>
      <Navbar title="Importa" />
      <div className="space-y-6 p-6">
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Fatture CSV</TabsTrigger>
            <TabsTrigger value="bank-statement">Estratto Conto</TabsTrigger>
            <TabsTrigger value="fatturapa">Fatture XML (FatturaPA)</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices">
            <ImportClient />
          </TabsContent>
          <TabsContent value="bank-statement">
            <BankStatementImportClient />
          </TabsContent>
          <TabsContent value="fatturapa">
            <FatturapaImportClient />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
