"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { connectorCreateSchema, type ConnectorCreateInput } from "@/lib/validations/connector";
import { useFicCompanies } from "@/lib/hooks/use-connectors";
import { Loader2, ExternalLink } from "lucide-react";

interface ConnectorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  defaultValues?: Partial<ConnectorCreateInput>;
  onSubmit: (data: ConnectorCreateInput) => void;
  isPending?: boolean;
}

const CONNECTOR_TYPES = [
  { value: "FATTURE_IN_CLOUD", label: "Fatture in Cloud" },
  { value: "CSV_IMPORT", label: "Import CSV" },
  { value: "MANUAL", label: "Manuale" },
] as const;

const DEFAULT_SYNC_FROM_DATE = `${new Date().getFullYear()}-01-01`;
const DEFAULT_SYNC_TO_DATE = new Date().toISOString().slice(0, 10);

interface FicCompanyOption {
  id: number;
  name: string;
}

export function ConnectorFormDialog({
  open,
  onOpenChange,
  editId,
  defaultValues,
  onSubmit,
  isPending,
}: ConnectorFormDialogProps) {
  const isEdit = !!editId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConnectorCreateInput>({
    resolver: zodResolver(connectorCreateSchema) as never,
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "FATTURE_IN_CLOUD",
      config: defaultValues?.config ?? {
        accessToken: "",
        companyId: "",
        syncFromDate: DEFAULT_SYNC_FROM_DATE,
        syncToDate: DEFAULT_SYNC_TO_DATE,
      },
    },
  });

  const connectorType = watch("type");
  const accessTokenValue = watch("config.accessToken");
  const companyIdValue = watch("config.companyId");

  // Company list state
  const [companies, setCompanies] = useState<FicCompanyOption[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const ficCompanies = useFicCompanies();

  // Auto-fetch companies when token is pasted (min 20 chars to avoid partial input)
  const tokenReady = (accessTokenValue?.length ?? 0) >= 20;

  function handleFetchCompanies() {
    if (!accessTokenValue) return;
    ficCompanies.mutate(accessTokenValue, {
      onSuccess: (res) => {
        setCompanies(res.companies);
        setCompaniesLoaded(true);
        // Auto-select if only one company
        if (res.companies.length === 1) {
          setValue("config.companyId", String(res.companies[0].id));
        }
      },
    });
  }

  // Reset companies when token changes
  useEffect(() => {
    setCompanies([]);
    setCompaniesLoaded(false);
  }, [accessTokenValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica" : "Nuovo"} Connettore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conn-name">Nome</Label>
            <Input id="conn-name" {...register("name")} placeholder="Nome del connettore" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={connectorType}
              onValueChange={(v) => v && setValue("type", v as ConnectorCreateInput["type"])}
              disabled={isEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTOR_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {connectorType === "FATTURE_IN_CLOUD" && (
            <div className="space-y-4 rounded-lg border p-4">
              {/* Instructions */}
              <div className="bg-muted/50 text-muted-foreground space-y-1.5 rounded-md p-3 text-xs">
                <p className="text-foreground font-medium">Come ottenere il token:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    Accedi a{" "}
                    <a
                      href="https://secure.fattureincloud.it/settings-apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-0.5 font-medium hover:underline"
                    >
                      Fatture in Cloud &rsaquo; Impostazioni &rsaquo; App collegate
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Clicca &ldquo;Collega nuova applicazione&rdquo;</li>
                  <li>Inserisci il Client ID della tua app</li>
                  <li>Seleziona l&rsquo;azienda e i permessi di lettura</li>
                  <li>Copia il token generato e incollalo qui sotto</li>
                </ol>
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <Label htmlFor="conn-accessToken">Access Token</Label>
                <Input
                  id="conn-accessToken"
                  type="password"
                  {...register("config.accessToken")}
                  placeholder={isEdit ? "Lascia vuoto per mantenere" : "Incolla il Bearer token"}
                />
                {errors.config?.accessToken && (
                  <p className="text-destructive text-xs">{errors.config.accessToken.message}</p>
                )}
              </div>

              {/* Company ID — fetched via API */}
              <div className="space-y-2">
                <Label>Azienda</Label>
                {!companiesLoaded ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!tokenReady || ficCompanies.isPending}
                      onClick={handleFetchCompanies}
                    >
                      {ficCompanies.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Recupero aziende...
                        </>
                      ) : (
                        "Carica aziende dal token"
                      )}
                    </Button>
                  </div>
                ) : companies.length === 0 ? (
                  <p className="text-destructive text-xs">
                    Nessuna azienda trovata per questo token
                  </p>
                ) : companies.length === 1 ? (
                  <div className="bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{companies[0].name}</span>
                    <span className="text-muted-foreground">(ID: {companies[0].id})</span>
                  </div>
                ) : (
                  <Select
                    value={companyIdValue}
                    onValueChange={(v) => v && setValue("config.companyId", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona azienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} (ID: {c.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {ficCompanies.isError && (
                  <p className="text-destructive text-xs">{ficCompanies.error.message}</p>
                )}
                {errors.config?.companyId && (
                  <p className="text-destructive text-xs">{errors.config.companyId.message}</p>
                )}
                {/* Hidden input so react-hook-form tracks the value */}
                <input type="hidden" {...register("config.companyId")} />
              </div>

              {/* Sync date range */}
              <div className="space-y-2">
                <Label>Periodo di import</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Da</span>
                    <Input type="date" {...register("config.syncFromDate")} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">A</span>
                    <Input type="date" {...register("config.syncToDate")} />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Verranno importate solo le fatture nel periodo selezionato
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : isEdit ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
