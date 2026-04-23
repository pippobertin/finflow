"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
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
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Link non valido. Richiedi un nuovo reset dalla pagina di login.
            </p>
            <Link
              href="/login"
              className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
            >
              Torna al login
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
              <div className="space-y-2">
                <Label htmlFor="password">Nuova password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Conferma password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvataggio..." : "Salva password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
