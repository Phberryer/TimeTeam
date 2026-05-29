"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Plus, Users, Briefcase, UserCheck, Download, CheckCircle, Clock } from "lucide-react";
import { formatTime, formatDateShort, formatDuration, WORK_TYPE_LABELS, WORK_TYPE_COLORS } from "@/lib/utils";
import { SessionCard } from "@/components/session-card";

interface Employer {
  id: string;
  name: string;
  _count?: { users: number; workSessions: number };
}
interface Client {
  id: string;
  name: string;
  _count?: { workSessions: number };
}
interface UserEmployer {
  userId: string;
  employerId: string;
  employer: { id: string; name: string };
}
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
  employers: UserEmployer[];
}
interface WorkSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  workType: string;
  employer: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null };
  validated: boolean;
  notes: string | null;
}

type Tab = "users" | "employers" | "clients" | "sessions";

interface Props {
  initialUsers: User[];
  initialEmployers: Employer[];
  initialClients: Client[];
  initialSessions: WorkSession[];
}

export function AdminClient({ initialUsers, initialEmployers, initialClients, initialSessions }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [employers, setEmployers] = useState(initialEmployers);
  const [clients, setClients] = useState(initialClients);
  const [sessions, setSessions] = useState(initialSessions);

  // ── Employer CRUD ────────────────────────────────────────────────
  const [empDialog, setEmpDialog] = useState(false);
  const [empEdit, setEmpEdit] = useState<Employer | null>(null);
  const [empName, setEmpName] = useState("");
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);

  const openEmpDialog = (emp?: Employer) => {
    setEmpEdit(emp ?? null);
    setEmpName(emp?.name ?? "");
    setEmpError(null);
    setEmpDialog(true);
  };

  const saveEmployer = async () => {
    setEmpError(null);
    setEmpLoading(true);
    try {
      const url = empEdit ? `/api/employers/${empEdit.id}` : "/api/employers";
      const method = empEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: empName }),
      });
      const data = await res.json();
      if (!res.ok) { setEmpError(data.error); return; }
      if (empEdit) {
        setEmployers((prev) => prev.map((e) => (e.id === data.id ? { ...e, ...data } : e)));
      } else {
        setEmployers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setEmpDialog(false);
    } finally {
      setEmpLoading(false);
    }
  };

  const deleteEmployer = async (id: string) => {
    if (!confirm("Supprimer cet employeur ?")) return;
    await fetch(`/api/employers/${id}`, { method: "DELETE" });
    setEmployers((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Client CRUD ────────────────────────────────────────────────
  const [cliDialog, setCliDialog] = useState(false);
  const [cliEdit, setCliEdit] = useState<Client | null>(null);
  const [cliName, setCliName] = useState("");
  const [cliLoading, setCliLoading] = useState(false);
  const [cliError, setCliError] = useState<string | null>(null);

  const openCliDialog = (cli?: Client) => {
    setCliEdit(cli ?? null);
    setCliName(cli?.name ?? "");
    setCliError(null);
    setCliDialog(true);
  };

  const saveClient = async () => {
    setCliError(null);
    setCliLoading(true);
    try {
      const url = cliEdit ? `/api/clients/${cliEdit.id}` : "/api/clients";
      const method = cliEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cliName }),
      });
      const data = await res.json();
      if (!res.ok) { setCliError(data.error); return; }
      if (cliEdit) {
        setClients((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
      } else {
        setClients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setCliDialog(false);
    } finally {
      setCliLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // ── User management ────────────────────────────────────────────────
  const [userDialog, setUserDialog] = useState(false);
  const [userEdit, setUserEdit] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "USER">("USER");
  const [userEmployers, setUserEmployers] = useState<string[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  const openUserDialog = (u: User) => {
    setUserEdit(u);
    setUserRole(u.role);
    setUserEmployers(u.employers.map((ue) => ue.employerId));
    setUserDialog(true);
  };

  const saveUser = async () => {
    if (!userEdit) return;
    setUserLoading(true);
    try {
      const res = await fetch(`/api/users/${userEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userRole, employerIds: userEmployers }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
        setUserDialog(false);
      }
    } finally {
      setUserLoading(false);
    }
  };

  // ── Sessions management ────────────────────────────────────────────────
  const handleSessionUpdate = (updated: WorkSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };
  const handleSessionDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleValidate = async (sessionId: string, validated: boolean) => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validated }),
    });
    const data = await res.json();
    if (res.ok) handleSessionUpdate(data);
  };

  const handleExport = async () => {
    const res = await fetch("/api/export?all=true");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timeteam-export-complet.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "users", label: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
    { key: "employers", label: "Employeurs", icon: <Briefcase className="h-4 w-4" /> },
    { key: "clients", label: "Clients", icon: <UserCheck className="h-4 w-4" /> },
    { key: "sessions", label: "Sessions récentes", icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-1">Gérez les utilisateurs, employeurs, clients et sessions</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter tout (Excel)
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Utilisateurs", value: users.length, color: "blue" },
          { label: "Employeurs", value: employers.length, color: "purple" },
          { label: "Clients", value: clients.length, color: "green" },
          { label: "Sessions totales", value: sessions.length, color: "orange" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                {u.image ? (
                  <img src={u.image} alt={u.name ?? ""} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {u.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{u.name ?? "Sans nom"}</span>
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                      {u.role === "ADMIN" ? "Admin" : "Utilisateur"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  {u.employers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.employers.map((ue) => (
                        <span key={ue.employerId} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {ue.employer.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => openUserDialog(u)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employers tab */}
      {tab === "employers" && (
        <div className="space-y-4">
          <Button onClick={() => openEmpDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel employeur
          </Button>
          <div className="space-y-3">
            {employers.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{e.name}</p>
                    {e._count && (
                      <p className="text-sm text-gray-500">
                        {e._count.users} utilisateur{e._count.users !== 1 ? "s" : ""} ·{" "}
                        {e._count.workSessions} session{e._count.workSessions !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEmpDialog(e)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteEmployer(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {employers.length === 0 && (
              <p className="text-center text-gray-400 py-8">Aucun employeur. Créez-en un ci-dessus.</p>
            )}
          </div>
        </div>
      )}

      {/* Clients tab */}
      {tab === "clients" && (
        <div className="space-y-4">
          <Button onClick={() => openCliDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
          <div className="space-y-3">
            {clients.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    {c._count && (
                      <p className="text-sm text-gray-500">
                        {c._count.workSessions} session{c._count.workSessions !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openCliDialog(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteClient(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clients.length === 0 && (
              <p className="text-center text-gray-400 py-8">Aucun client. Créez-en un ci-dessus.</p>
            )}
          </div>
        </div>
      )}

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="relative">
              <SessionCard
                session={s}
                employers={employers}
                clients={clients}
                onUpdate={handleSessionUpdate}
                onDelete={handleSessionDelete}
                showUser
                userName={s.user.name ?? s.user.email ?? ""}
              />
              {!s.validated && s.endTime && (
                <div className="absolute top-3 right-24">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => handleValidate(s.id, true)}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Valider
                  </Button>
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-gray-400 py-8">Aucune session récente.</p>
          )}
        </div>
      )}

      {/* Employer dialog */}
      <Dialog open={empDialog} onOpenChange={setEmpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{empEdit ? "Modifier l'employeur" : "Nouvel employeur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {empError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{empError}</div>
            )}
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="Nom de l'employeur"
                onKeyDown={(e) => e.key === "Enter" && saveEmployer()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpDialog(false)}>Annuler</Button>
            <Button onClick={saveEmployer} disabled={empLoading || !empName.trim()}>
              {empLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client dialog */}
      <Dialog open={cliDialog} onOpenChange={setCliDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cliEdit ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {cliError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{cliError}</div>
            )}
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={cliName}
                onChange={(e) => setCliName(e.target.value)}
                placeholder="Nom du client"
                onKeyDown={(e) => e.key === "Enter" && saveClient()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCliDialog(false)}>Annuler</Button>
            <Button onClick={saveClient} disabled={cliLoading || !cliName.trim()}>
              {cliLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {userEdit && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {userEdit.image ? (
                  <img src={userEdit.image} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {userEdit.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{userEdit.name}</p>
                  <p className="text-sm text-gray-500">{userEdit.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select value={userRole} onValueChange={(v) => setUserRole(v as "ADMIN" | "USER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employeurs assignés</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {employers.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={userEmployers.includes(e.id)}
                        onChange={(ev) => {
                          setUserEmployers((prev) =>
                            ev.target.checked
                              ? [...prev, e.id]
                              : prev.filter((id) => id !== e.id)
                          );
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{e.name}</span>
                    </label>
                  ))}
                  {employers.length === 0 && (
                    <p className="text-sm text-gray-400 px-2 py-1">Aucun employeur disponible</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Annuler</Button>
            <Button onClick={saveUser} disabled={userLoading}>
              {userLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
