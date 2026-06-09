import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CompetitionLevel, EstateType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1)}×`;
}

export function formatPercent(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export const COMPETITION_COLORS: Record<CompetitionLevel, string> = {
  low: "#86efac",
  moderate: "#fcd34d",
  high: "#fca5a5",
  extreme: "#f87171",
};

export const COMPETITION_BG: Record<CompetitionLevel, string> = {
  low: "bg-green-400/20 border-green-400/40 text-green-300",
  moderate: "bg-amber-400/20 border-amber-400/40 text-amber-300",
  high: "bg-red-400/20 border-red-400/40 text-red-300",
  extreme: "bg-red-600/20 border-red-600/40 text-red-400",
};

export const COMPETITION_LABEL: Record<CompetitionLevel, string> = {
  low: "Low Competition",
  moderate: "Moderate Competition",
  high: "High Competition",
  extreme: "Extreme Competition",
};

export const ESTATE_LABELS: Record<string, string> = {
  mature: "Mature",
  "non-mature": "Non-Mature",
  standard: "Standard",
  plus: "Plus",
  prime: "Prime",
};

export const APPLICANT_LABELS: Record<string, string> = {
  firstTimer: "First-Timer",
  secondTimer: "Second-Timer",
  singles: "Singles (SC)",
};

export function estateTypeGroup(estateType: EstateType): "legacy" | "spp" {
  return ["mature", "non-mature"].includes(estateType) ? "legacy" : "spp";
}
