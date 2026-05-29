"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Edit2, Trash2, CheckCircle } from "lucide-react";
import { formatTime, formatDuration, WORK_TYPE_LABELS, WORK_TYPE_COLORS } from "@/lib/utils";

interface Employer { id: string; name: string }
interface Client { id: string; name: string }
interface WorkSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  workType: string;
  employer: Employer | null;
  client: Client | null;
  validated: boolean;
  notes: string | null;
}

interface Props {
  session: WorkSession;
  employers: Employer[];
  clients: Client[];
  onUpdate: (updated: WorkSession) => void;
  onDelete: (id: string) => void;
  showUser?: boolean;
  userName?: string;
}

export function SessionCard({ session, employers, clients, onUpdate, onDelete, showUser, userName }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [editEmployer, setEditEmployer] = useState(session.employer?.id ?? "");
  const [editClient, setEditClient] = useState(session.client?.id ?? "");
  const [editWorkType, setEditWorkType] = useState(session.workType);
  const [editNotes, setEditNotes] = useState(session.notes ?? "");

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId: editEmployer || null,
          clientId: editClient || null,
          workType: editWorkType,
          notes: editNotes || null,
        }),
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

  const isRunning = !session.endTime;

  return (
    <>
      <Card className={`transition-shadow hover:shadow-md ${isRunning ? "border-l-4 border-l-blue-500" : ""}`}>
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
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`text-xs ${WORK_TYPE_COLORS[session.workType]}`} variant="outline">
                {WORK_TYPE_LABELS[session.workType]}
              </Badge>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-blue-600"
              onClick={() => {
                setEditEmployer(session.employer?.id ?? "");
                setEditClient(session.client?.id ?? "");
                setEditWorkType(session.workType);
                setEditNotes(session.notes ?? "");
                setEditOpen(true);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
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
            <div className="space-y-1.5">
              <Label>Employeur</Label>
              <Select value={editEmployer} onValueChange={setEditEmployer}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun employeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {employers.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={editClient} onValueChange={setEditClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de travail</Label>
              <Select value={editWorkType} onValueChange={setEditWorkType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Description de la tâche…"
                rows={3}
              />
            </div>
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
