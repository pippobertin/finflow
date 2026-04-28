"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

function PasswordField({
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
          required
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwValid = password.length >= 8 && hasLetter(password) && hasNumber(password);
  const confirmValid = confirm.length > 0 && confirm === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pwValid) {
      setError("La password deve avere almeno 8 caratteri, una lettera e un numero");
      return;
    }
    if (!confirmValid) {
      setError("Le password non coincidono");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Errore durante il reset");
      return;
    }

    setSuccess(true);
  }

  if (!token) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-muted-foreground text-sm">Link non valido o scaduto.</p>
            <Link
              href="/login/forgot-password"
              className="text-primary inline-block text-sm font-medium hover:underline"
            >
              Richiedi un nuovo link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg font-bold">
            F
          </div>
          <CardTitle className="text-xl">Nuova password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-600">Password aggiornata con successo.</p>
              <Link href="/login" className="text-primary text-sm font-medium hover:underline">
                Accedi ora
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField
                id="password"
                label="Nuova password"
                value={password}
                onChange={setPassword}
                placeholder="Minimo 8 caratteri, una lettera e un numero"
              />
              {password.length > 0 && !pwValid && (
                <p className="text-destructive text-xs">
                  Almeno 8 caratteri, una lettera e un numero.
                </p>
              )}
              <PasswordField
                id="confirm"
                label="Conferma password"
                value={confirm}
                onChange={setConfirm}
              />
              {confirm.length > 0 && !confirmValid && (
                <p className="text-destructive text-xs">Le password non coincidono.</p>
              )}

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !pwValid || !confirmValid}
              >
                {loading ? "Salvataggio..." : "Salva password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
