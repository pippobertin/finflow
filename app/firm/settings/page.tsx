import { ChangePasswordCard } from "@/components/settings/change-password-card";

export default function FirmSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gestisci il tuo account</p>
      </div>
      <ChangePasswordCard />
    </div>
  );
}
