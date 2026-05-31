"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { SessionCard } from "@/components/session-card";

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

interface Props {
  initialSessions: WorkSession[];
  initialRunning: WorkSession | null;
  employers: Employer[];
  clients: Client[];
  userName: string;
}

export function DashboardClient({ initialSessions, initialRunning, employers, clients, userName }: Props) {
  const [sessions, setSessions] = useState<WorkSession[]>(initialSessions);
  const [running, setRunning] = useState<WorkSession | null>(initialRunning);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Work types fetched from API
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // Form state for new session
  const [employerId, setEmployerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [workTypeId, setWorkTypeId] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch work types on mount
  useEffect(() => {
    fetch("/api/work-types")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkTypes(data);
      })
      .catch(() => {});
  }, []);

  // Timer
  useEffect(() => {
    if (!running) { setElapsed(0); return; }
    const update = () =>
      setElapsed(Math.floor((Date.now() - new Date(running.startTime).getTime()) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [running]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const todayTotal = sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId: employerId || null,
          clientId: clientId || null,
          workTypeId: workTypeId || null,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setRunning(data);
      setSessions((prev) => [data, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!running) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${running.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setRunning(null);
      setSessions((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = useCallback((updated: WorkSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (running?.id === updated.id) setRunning(null);
  }, [running]);

  const handleDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (running?.id === id) setRunning(null);
  }, [running]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Temps aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(todayTotal + Math.floor(elapsed / 60))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions terminées</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => s.endTime).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={running ? "bg-red-100 p-3 rounded-full" : "bg-gray-100 p-3 rounded-full"}>
              <AlertCircle className={`h-5 w-5 ${running ? "text-red-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="text-sm font-semibold mt-0.5">
                {running ? (
                  <span className="text-red-600">En cours – {formatElapsed(elapsed)}</span>
                ) : (
                  <span className="text-gray-500">Aucune session active</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer control */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">
            {running ? "Session en cours" : "Démarrer une session"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {running ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-5xl font-mono font-bold text-blue-600 tabular-nums">
                  {formatElapsed(elapsed)}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Démarré à {formatTime(running.startTime)}
                  {running.employer && ` · ${running.employer.name}`}
                  {running.client && ` · ${running.client.name}`}
                </p>
                {running.workType && (
                  <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                    {running.workType.name}
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes au fil de la session…"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleStop}
                disabled={loading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                <Square className="h-5 w-5 mr-2" />
                Arrêter la session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Employeur</Label>
                  <Select value={employerId} onValueChange={setEmployerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {employers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Type de travail</Label>
                <Select value={workTypeId} onValueChange={setWorkTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Description de la tâche…"
                  rows={2}
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Play className="h-5 w-5 mr-2" />
                Démarrer le chronomètre
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Sessions d'aujourd'hui</h2>
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              employers={employers}
              clients={clients}
              workTypes={workTypes}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
