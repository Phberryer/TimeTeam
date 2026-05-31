"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter } from "lucide-react";
import { formatDateShort, formatDuration } from "@/lib/utils";
import { SessionCard, Permissions } from "@/components/session-card";

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
  employers: Employer[];
  clients: Client[];
  userId: string;
  permissions: Permissions;
}

export function SessionsClient({ initialSessions, employers, clients, userId, permissions }: Props) {
  const [sessions, setSessions] = useState<WorkSession[]>(initialSessions);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [search, setSearch] = useState("");
  const [filterWorkType, setFilterWorkType] = useState("all");
  const [filterEmployer, setFilterEmployer] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/work-types")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setWorkTypes(data); })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        !search ||
        s.employer?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.client?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.notes?.toLowerCase().includes(search.toLowerCase()) ||
        s.workType?.name.toLowerCase().includes(search.toLowerCase());
      const matchWorkType = filterWorkType === "all" || s.workType?.id === filterWorkType;
      const matchEmployer = filterEmployer === "all" || s.employer?.id === filterEmployer;
      return matchSearch && matchWorkType && matchEmployer;
    });
  }, [sessions, search, filterWorkType, filterEmployer]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, WorkSession[]>();
    for (const s of filtered) {
      const key = formatDateShort(s.startTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalFiltered = filtered.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const handleUpdate = (updated: WorkSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?userId=${userId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timeteam-export.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes sessions</h1>
          <p className="text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {exporting ? "Export en cours…" : "Exporter Excel"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex gap-3 flex-wrap pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterWorkType} onValueChange={setFilterWorkType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de travail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {workTypes.map((wt) => (
                <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEmployer} onValueChange={setFilterEmployer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Employeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les employeurs</SelectItem>
              {employers.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-600 bg-blue-50 rounded-lg px-4 py-2">
          <span className="font-medium text-blue-700">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""} filtrée{filtered.length !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>Total : <strong>{formatDuration(totalFiltered)}</strong></span>
        </div>
      )}

      {/* Sessions grouped by date */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune session trouvée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, daySessions]) => {
            const dayTotal = daySessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
                  <span className="text-sm text-gray-500">{formatDuration(dayTotal)}</span>
                </div>
                <div className="space-y-2">
                  {daySessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      employers={employers}
                      clients={clients}
                      workTypes={workTypes}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      permissions={{
                        ...permissions,
                        canValidate: permissions.canValidate && !s.validated && !!s.endTime,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
