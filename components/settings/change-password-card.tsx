"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

const hasLetter = (s: string) => /[a-zA-Z]/.test(s);
const hasNumber = (s: string) => /[0-9]/.test(s);

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const newValid = newPassword.length >= 8 && hasLetter(newPassword) && hasNumber(newPassword);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === newPassword;
  const formValid = currentPassword.length > 0 && newValid && confirmValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Errore durante il cambio password");
        return;
      }

      toast.success("Password aggiornata con successo");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5" />
          Cambio password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="current-password"
            label="Password attuale"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordInput
            id="new-password"
            label="Nuova password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Minimo 8 caratteri, una lettera e un numero"
          />
          {newPassword.length > 0 && !newValid && (
            <p className="text-destructive text-xs">
              La password deve avere almeno 8 caratteri, una lettera e un numero.
            </p>
          )}
          <PasswordInput
            id="confirm-password"
            label="Conferma nuova password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          {confirmPassword.length > 0 && !confirmValid && (
            <p className="text-destructive text-xs">Le password non coincidono.</p>
          )}

          <Button type="submit" disabled={!formValid || loading}>
            {loading ? "Salvataggio..." : "Salva nuova password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
