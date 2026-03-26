"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";
import type {
  OrganizationSettings,
  CustomerCollectionOverride,
  CostCenterAlert,
} from "@/lib/validations/settings";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export function AdvancedClient() {
  const { data: session } = useSession();
  const isViewer = session?.user?.role === "VIEWER";
  const { data: settings, isLoading } = useSettings();
  const { data: costCenters } = useCostCenters();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState<OrganizationSettings>({
    defaultCollectionDays: 60,
    customerCollectionOverrides: [],
    globalMinBalance: 0,
    costCenterAlerts: [],
    defaultForecastHorizonMonths: 6,
    currentBalance: null,
    currentBalanceUpdatedAt: null,
    vatPeriodicity: "quarterly",
  });

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync server data into form
      setForm(settings);
    }
  }, [settings]);

  function handleSave() {
    updateSettings.mutate(form, {
      onSuccess: () => toast.success("Impostazioni salvate"),
      onError: (err) => toast.error(err.message),
    });
  }

  // Customer collection overrides
  function addCustomerOverride() {
    setForm((f) => ({
      ...f,
      customerCollectionOverrides: [
        ...f.customerCollectionOverrides,
        { customerName: "", days: 60 },
      ],
    }));
  }

  function updateCustomerOverride(index: number, update: Partial<CustomerCollectionOverride>) {
    setForm((f) => ({
      ...f,
      customerCollectionOverrides: f.customerCollectionOverrides.map((o, i) =>
        i === index ? { ...o, ...update } : o,
      ),
    }));
  }

  function removeCustomerOverride(index: number) {
    setForm((f) => ({
      ...f,
      customerCollectionOverrides: f.customerCollectionOverrides.filter((_, i) => i !== index),
    }));
  }

  // Cost center alerts
  function addCostCenterAlert() {
    setForm((f) => ({
      ...f,
      costCenterAlerts: [...f.costCenterAlerts, { costCenterId: "", minBalance: 0 }],
    }));
  }

  function updateCostCenterAlert(index: number, update: Partial<CostCenterAlert>) {
    setForm((f) => ({
      ...f,
      costCenterAlerts: f.costCenterAlerts.map((a, i) => (i === index ? { ...a, ...update } : a)),
    }));
  }

  function removeCostCenterAlert(index: number) {
    setForm((f) => ({
      ...f,
      costCenterAlerts: f.costCenterAlerts.filter((_, i) => i !== index),
    }));
  }

  if (isLoading) return null;

  const ccList = (costCenters ?? []) as { id: string; name: string }[];

  return (
    <>
      <Navbar title="Impostazioni Avanzate" />
      <div className="space-y-6 p-6">
        {/* Section 1: Collection Times */}
        <Card>
          <CardHeader>
            <CardTitle>Tempi di Incasso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-56 shrink-0">Giorni incasso predefiniti</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.defaultCollectionDays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    defaultCollectionDays: parseInt(e.target.value) || 60,
                  }))
                }
                className="w-24"
                disabled={isViewer}
              />
              <span className="text-muted-foreground text-sm">giorni</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Override per Cliente</Label>
                {!isViewer && (
                  <Button size="sm" variant="outline" onClick={addCustomerOverride}>
                    <Plus className="mr-1 h-3 w-3" />
                    Aggiungi
                  </Button>
                )}
              </div>
              {form.customerCollectionOverrides.map((override, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    placeholder="Nome cliente"
                    value={override.customerName}
                    onChange={(e) => updateCustomerOverride(i, { customerName: e.target.value })}
                    className="flex-1"
                    disabled={isViewer}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={override.days}
                    onChange={(e) =>
                      updateCustomerOverride(i, {
                        days: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-24"
                    disabled={isViewer}
                  />
                  <span className="text-muted-foreground text-sm">gg</span>
                  {!isViewer && (
                    <Button size="sm" variant="ghost" onClick={() => removeCustomerOverride(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Soglie di Allerta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-56 shrink-0">Saldo minimo globale</Label>
              <Input
                type="number"
                value={form.globalMinBalance}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    globalMinBalance: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-32"
                disabled={isViewer}
              />
              <span className="text-muted-foreground text-sm">EUR</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Soglie per Centro di Costo</Label>
                {!isViewer && (
                  <Button size="sm" variant="outline" onClick={addCostCenterAlert}>
                    <Plus className="mr-1 h-3 w-3" />
                    Aggiungi
                  </Button>
                )}
              </div>
              {form.costCenterAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Select
                    value={alert.costCenterId}
                    onValueChange={(v) => v && updateCostCenterAlert(i, { costCenterId: v })}
                    disabled={isViewer}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleziona centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {ccList.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={alert.minBalance}
                    onChange={(e) =>
                      updateCostCenterAlert(i, {
                        minBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32"
                    disabled={isViewer}
                  />
                  <span className="text-muted-foreground text-sm">EUR</span>
                  {!isViewer && (
                    <Button size="sm" variant="ghost" onClick={() => removeCostCenterAlert(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Previsioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label className="w-56 shrink-0">Orizzonte previsione</Label>
              <Slider
                value={form.defaultForecastHorizonMonths}
                min={1}
                max={24}
                step={1}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    defaultForecastHorizonMonths: v as number,
                  }))
                }
                className="w-48"
                disabled={isViewer}
              />
              <span className="w-16 text-sm font-medium">
                {form.defaultForecastHorizonMonths} mesi
              </span>
            </div>
          </CardContent>
        </Card>

        {!isViewer && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
