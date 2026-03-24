"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrganization, useUpdateOrganization } from "@/lib/hooks/use-organization";
import {
  organizationUpdateSchema,
  type OrganizationUpdateInput,
} from "@/lib/validations/organization";
import { toast } from "sonner";

export function OrganizationClient() {
  const { data: session } = useSession();
  const isViewer = session?.user?.role === "VIEWER";
  const { data: org, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationUpdateInput>({
    resolver: zodResolver(organizationUpdateSchema),
  });

  useEffect(() => {
    if (org) {
      reset({
        name: (org.name as string) ?? "",
        vatNumber: (org.vatNumber as string) ?? null,
        address: (org.address as string) ?? null,
        city: (org.city as string) ?? null,
        province: (org.province as string) ?? null,
        zipCode: (org.zipCode as string) ?? null,
        email: (org.email as string) ?? null,
        phone: (org.phone as string) ?? null,
        currentBalance: (org.currentBalance as number) ?? null,
      });
    }
  }, [org, reset]);

  function onSubmit(data: OrganizationUpdateInput) {
    updateOrg.mutate(data, {
      onSuccess: () => toast.success("Organizzazione aggiornata"),
      onError: (err) => toast.error(err.message),
    });
  }

  if (isLoading) return null;

  return (
    <>
      <Navbar title="Organizzazione" />
      <div className="space-y-6 p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Dati Aziendali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ragione Sociale *</Label>
                    <Input id="name" {...register("name")} disabled={isViewer} />
                    {errors.name && (
                      <p className="text-destructive text-sm">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Partita IVA</Label>
                    <Input
                      id="vatNumber"
                      placeholder="IT00000000000"
                      {...register("vatNumber")}
                      disabled={isViewer}
                    />
                    {errors.vatNumber && (
                      <p className="text-destructive text-sm">{errors.vatNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} disabled={isViewer} />
                    {errors.email && (
                      <p className="text-destructive text-sm">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input id="phone" {...register("phone")} disabled={isViewer} />
                    {errors.phone && (
                      <p className="text-destructive text-sm">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input id="address" {...register("address")} disabled={isViewer} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Città</Label>
                    <Input id="city" {...register("city")} disabled={isViewer} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia</Label>
                      <Input
                        id="province"
                        maxLength={2}
                        placeholder="BO"
                        {...register("province")}
                        disabled={isViewer}
                      />
                      {errors.province && (
                        <p className="text-destructive text-sm">{errors.province.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CAP</Label>
                      <Input
                        id="zipCode"
                        maxLength={5}
                        placeholder="40100"
                        {...register("zipCode")}
                        disabled={isViewer}
                      />
                      {errors.zipCode && (
                        <p className="text-destructive text-sm">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saldo Conto Corrente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm space-y-2">
                <Label htmlFor="currentBalance">Saldo attuale (EUR)</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("currentBalance", { valueAsNumber: true })}
                  disabled={isViewer}
                />
                <p className="text-muted-foreground text-xs">
                  Questo valore viene usato come saldo iniziale nella dashboard e nelle previsioni
                  cashflow.
                </p>
              </div>
            </CardContent>
          </Card>

          {!isViewer && (
            <div className="flex justify-end">
              <Button type="submit" disabled={!isDirty || updateOrg.isPending}>
                {updateOrg.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
