"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Edit2, Trash2, CheckCircle, Lock, LockOpen } from "lucide-react";
import { formatTime, formatDuration } from "@/lib/utils";

interface Employer { id: string; name: string }
interface Client { id: string; name: string }
interface WorkType { id: string; name: string }
interface WorkSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  workType: WorkType | null;
  employer: Employer | null;
  client: Client | null;
  validated: boolean;
  notes: string | null;
}

export interface Permissions {
  canEditEmployer: boolean;
  canEditClient: boolean;
  canEditWorkType: boolean;
  canEditNotes: boolean;
  canValidate: boolean;   // true if session belongs to current user and not validated
  canReopen: boolean;     // true if current user is ADMIN
}

interface Props {
  session: WorkSession;
  employers: Employer[];
  clients: Client[];
  workTypes: WorkType[];
  onUpdate: (updated: WorkSession) => void;
  onDelete: (id: string) => void;
  showUser?: boolean;
  userName?: string;
  permissions?: Permissions;
}

const DEFAULT_PERMISSIONS: Permissions = {
  canEditEmployer: true,
  canEditClient: true,
  canEditWorkType: true,
  canEditNotes: true,
  canValidate: false,
  canReopen: false,
};

export function SessionCard({
  session,
  employers,
  clients,
  workTypes,
  onUpdate,
  onDelete,
  showUser,
  userName,
  permissions = DEFAULT_PERMISSIONS,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [editEmployer, setEditEmployer] = useState(session.employer?.id ?? "");
  const [editClient, setEditClient] = useState(session.client?.id ?? "");
  const [editWorkType, setEditWorkType] = useState(session.workType?.id ?? "");
  const [editNotes, setEditNotes] = useState(session.notes ?? "");

  // Can the user open the edit dialog?
  const isRunning = !session.endTime;
  const canEdit =
    !session.validated &&
    (permissions.canEditEmployer ||
      permissions.canEditClient ||
      permissions.canEditWorkType ||
      permissions.canEditNotes);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (permissions.canEditEmployer) body.employerId = editEmployer && editEmployer !== "none" ? editEmployer : null;
      if (permissions.canEditClient) body.clientId = editClient && editClient !== "none" ? editClient : null;
      if (permissions.canEditWorkType) body.workTypeId = editWorkType && editWorkType !== "none" ? editWorkType : null;
      if (permissions.canEditNotes) body.notes = editNotes || null;

      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onUpdate(data);
      setEditOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette session ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      if (res.ok) onDelete(session.id);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/validate`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) onUpdate(data);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/reopen`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) onUpdate(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className={`transition-shadow hover:shadow-md ${isRunning ? "border-l-4 border-l-blue-500" : ""} ${session.validated ? "border-l-4 border-l-green-500" : ""}`}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                {formatTime(session.startTime)}
                {session.endTime && ` → ${formatTime(session.endTime)}`}
                {isRunning && (
                  <span className="ml-1 text-blue-600 animate-pulse">● En cours</span>
                )}
              </span>
              {session.duration && (
                <span className="text-sm text-gray-500">({formatDuration(session.duration)})</span>
              )}
              {session.validated && (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <Lock className="h-3 w-3" />
                  Validée
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {session.workType && (
                <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200" variant="outline">
                  {session.workType.name}
                </Badge>
              )}
              {session.employer && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {session.employer.name}
                </span>
              )}
              {session.client && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {session.client.name}
                </span>
              )}
              {showUser && userName && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {userName}
                </span>
              )}
            </div>
            {session.notes && (
              <p className="text-xs text-gray-400 mt-1 truncate">{session.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Valider button: shown when session is finished, not validated, and user can validate */}
            {!isRunning && !session.validated && permissions.canValidate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-green-600"
                onClick={handleValidate}
                disabled={loading}
                title="Valider la session"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            {/* Réouvrir button: admin only, shown on validated sessions */}
            {session.validated && permissions.canReopen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-orange-600"
                onClick={handleReopen}
                disabled={loading}
                title="Réouvrir la session"
              >
                <LockOpen className="h-4 w-4" />
              </Button>
            )}
            {/* Edit button: hidden on validated sessions unless admin */}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-blue-600"
                onClick={() => {
                  setEditEmployer(session.employer?.id ?? "");
                  setEditClient(session.client?.id ?? "");
                  setEditWorkType(session.workType?.id ?? "");
                  setEditNotes(session.notes ?? "");
                  setEditOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <div className="bg-blue-50 rounded-md px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                Horaires : {formatTime(session.startTime)}
                {session.endTime ? ` → ${formatTime(session.endTime)}` : " (en cours)"}
                {session.duration ? ` · ${formatDuration(session.duration)}` : ""}
              </span>
            </div>
            {permissions.canEditEmployer && (
              <div className="space-y-1.5">
                <Label>Employeur</Label>
                <Select value={editEmployer} onValueChange={setEditEmployer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun employeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {employers.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {permissions.canEditClient && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={editClient} onValueChange={setEditClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {permissions.canEditWorkType && (
              <div className="space-y-1.5">
                <Label>Type de travail</Label>
                <Select value={editWorkType} onValueChange={setEditWorkType}>
                  <SelectTrigger><SelectValue placeholder="Aucun type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {workTypes.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {permissions.canEditNotes && (
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Description de la tâche…"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
