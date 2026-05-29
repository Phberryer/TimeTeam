import * as XLSX from "xlsx";
import { formatDateShort, formatTime, formatDuration } from "./utils";

interface WorkSessionExport {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  workType: { name: string } | null;
  employer: { name: string } | null;
  client: { name: string } | null;
  user: { name: string | null; email: string | null };
  notes: string | null;
  validated: boolean;
}

export function generateExcelBuffer(
  sessions: WorkSessionExport[],
  title: string
): Buffer {
  const rows = sessions.map((s) => ({
    Date: s.startTime ? formatDateShort(s.startTime) : "",
    "Heure début": s.startTime ? formatTime(s.startTime) : "",
    "Heure fin": s.endTime ? formatTime(s.endTime) : "En cours",
    Durée: s.duration ? formatDuration(s.duration) : "",
    "Durée (min)": s.duration ?? "",
    Employeur: s.employer?.name ?? "",
    Client: s.client?.name ?? "",
    "Type de travail": s.workType?.name ?? "",
    Collaborateur: s.user.name ?? s.user.email ?? "",
    Notes: s.notes ?? "",
    Validé: s.validated ? "Oui" : "Non",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Heure début
    { wch: 12 }, // Heure fin
    { wch: 10 }, // Durée
    { wch: 12 }, // Durée (min)
    { wch: 20 }, // Employeur
    { wch: 20 }, // Client
    { wch: 20 }, // Type de travail
    { wch: 25 }, // Collaborateur
    { wch: 40 }, // Notes
    { wch: 8 },  // Validé
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Feuilles de temps");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
