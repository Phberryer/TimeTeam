import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
}

export const WORK_TYPE_LABELS: Record<string, string> = {
  DEVIS: "Devis",
  ARCHITECTURE: "Architecture",
  INGENIEUR: "Ingénieur",
  ADMIN: "Administratif",
  GESTION: "Gestion",
  AUTRE: "Autre",
};

export const WORK_TYPE_COLORS: Record<string, string> = {
  DEVIS: "bg-blue-100 text-blue-800",
  ARCHITECTURE: "bg-purple-100 text-purple-800",
  INGENIEUR: "bg-green-100 text-green-800",
  ADMIN: "bg-yellow-100 text-yellow-800",
  GESTION: "bg-orange-100 text-orange-800",
  AUTRE: "bg-gray-100 text-gray-800",
};
