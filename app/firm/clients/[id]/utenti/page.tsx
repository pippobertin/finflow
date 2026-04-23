"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  UserPlus,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  userType: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function UtentiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copiedPw, setCopiedPw] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/firm/clients/${id}/utenti`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    setTempPassword(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      email: fd.get("email") as string,
      name: (fd.get("name") as string) || undefined,
      userType: fd.get("userType") as string,
    };

    try {
      const res = await fetch(`/api/firm/clients/${id}/utenti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setTempPassword(data.tempPassword);
        setMessage({ type: "success", text: `Utente ${data.user.email} creato` });
        setShowForm(false);
        fetchUsers();
      }
    } catch {
      setMessage({ type: "error", text: "Errore di rete" });
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    const res = await fetch(`/api/firm/clients/${id}/utenti/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.ok) fetchUsers();
  }

  async function changeRole(userId: string, newType: string) {
    const res = await fetch(`/api/firm/clients/${id}/utenti/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userType: newType }),
    });
    if (res.ok) fetchUsers();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Eliminare l'utente ${email}? Questa azione non è reversibile.`)) return;
    const res = await fetch(`/api/firm/clients/${id}/utenti/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchUsers();
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setTempPassword(null);
            setMessage(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      {/* Temp password display */}
      {tempPassword && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-300">
            Password temporanea generata
          </p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-white px-3 py-1 font-mono text-lg font-bold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
              {tempPassword}
            </code>
            <Button variant="ghost" size="icon" onClick={copyPassword}>
              {copiedPw ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Comunica questa password all&apos;utente. Non sarà più visibile dopo.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/30"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4" /> Nuovo utente
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input id="email" name="email" type="email" required placeholder="utente@email.com" />
            </div>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Nome Cognome" />
            </div>
            <div>
              <Label htmlFor="userType">Ruolo</Label>
              <Select name="userType" defaultValue="CLIENT_ADMIN_BANK_ONLY">
                <SelectTrigger id="userType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT_OWNER">Titolare (accesso completo)</SelectItem>
                  <SelectItem value="CLIENT_ADMIN_BANK_ONLY">Solo Movimenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creazione..." : "Crea utente"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Annulla
            </Button>
          </div>
        </form>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nessun utente associato a questo cliente.
        </p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Ruolo</th>
                <th className="px-4 py-2 text-left font-medium">Stato</th>
                <th className="px-4 py-2 text-right font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{u.email}</td>
                  <td className="text-muted-foreground px-4 py-2">{u.name || "—"}</td>
                  <td className="px-4 py-2">
                    <RoleBadge userType={u.userType} onChange={(t) => changeRole(u.id, t)} />
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {u.isActive ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={u.isActive ? "Disattiva" : "Attiva"}
                        onClick={() => toggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Elimina"
                        onClick={() => deleteUser(u.id, u.email)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleBadge({
  userType,
  onChange,
}: {
  userType: string | null;
  onChange: (t: string) => void;
}) {
  const isBankOnly = userType === "CLIENT_ADMIN_BANK_ONLY";
  return (
    <button
      onClick={() => onChange(isBankOnly ? "CLIENT_OWNER" : "CLIENT_ADMIN_BANK_ONLY")}
      title="Clicca per cambiare ruolo"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        isBankOnly
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
      }`}
    >
      {isBankOnly ? (
        <>
          <ShieldAlert className="h-3 w-3" /> Solo Movimenti
        </>
      ) : (
        <>
          <Shield className="h-3 w-3" /> Titolare
        </>
      )}
    </button>
  );
}
