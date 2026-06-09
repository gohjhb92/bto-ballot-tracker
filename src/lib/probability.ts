import type {
  BtoExercise,
  FlatType,
  EstateType,
  ApplicantType,
  CompetitionLevel,
} from "./types";

export function oddsPerTry(rate: number): number {
  return Math.min(1, 1 / rate);
}

export function cumulativeOdds(rate: number, tries: number): number {
  if (rate <= 1) return 1; // guaranteed on first try — consistent with oddsPerTry
  const p = Math.min(0.99, 1 / rate);
  return 1 - Math.pow(1 - p, tries);
}

export function triesForTarget(rate: number, target: number): number {
  if (rate <= 1) return 1;
  const safeTarget = Math.min(target, 0.999); // prevent log(0) when target ≥ 1
  const p = Math.min(0.99, 1 / rate);
  return Math.ceil(Math.log(1 - safeTarget) / Math.log(1 - p));
}

export function competitionLevel(rate: number): CompetitionLevel {
  if (rate <= 1.7) return "low";
  if (rate <= 4.0) return "moderate";
  if (rate <= 8.0) return "high";
  return "extreme";
}

export function recentAverageRate(
  exercises: BtoExercise[],
  flatType: FlatType,
  estateType: EstateType,
  applicantType: ApplicantType,
  lastN = 4
): number | null {
  const rates: number[] = [];

  const sorted = [...exercises].sort((a, b) => b.id.localeCompare(a.id));

  for (const ex of sorted) {
    if (rates.length >= lastN) break;
    if (!ex.summary) continue;

    const summaryKey = Object.keys(ex.summary).find(
      (k) => k.toLowerCase() === estateType.toLowerCase()
    );
    if (!summaryKey) continue;

    const flatData = ex.summary[summaryKey][flatType];
    if (!flatData) continue;

    const val = flatData[applicantType];
    if (val != null) {
      rates.push(val);
    }
  }

  if (rates.length === 0) return null;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

export function buildTrendData(
  exercises: BtoExercise[],
  flatType: FlatType,
  estateType: EstateType,
  applicantType: ApplicantType
): { label: string; rate: number }[] {
  const sorted = [...exercises].sort((a, b) => a.id.localeCompare(b.id));
  const result: { label: string; rate: number }[] = [];

  for (const ex of sorted) {
    if (!ex.summary) continue;
    const summaryKey = Object.keys(ex.summary).find(
      (k) => k.toLowerCase() === estateType.toLowerCase()
    );
    if (!summaryKey) continue;
    const flatData = ex.summary[summaryKey][flatType];
    if (!flatData) continue;
    const val = flatData[applicantType];
    if (val != null) {
      result.push({ label: ex.label, rate: val });
    }
  }

  return result;
}

export function buildTownRates(
  exercises: BtoExercise[],
  flatType: FlatType,
  estateType: EstateType,
  applicantType: ApplicantType
): { town: string; rate: number; exerciseLabel: string }[] {
  const sorted = [...exercises].sort((a, b) => b.id.localeCompare(a.id));
  const seen = new Set<string>();
  const result: { town: string; rate: number; exerciseLabel: string }[] = [];

  for (const ex of sorted) {
    if (!ex.towns) continue;
    for (const project of ex.towns) {
      if (seen.has(project.town)) continue;
      if (project.estateType.toLowerCase() !== estateType.toLowerCase()) continue;
      const flatData = project.flatTypes[flatType];
      if (!flatData) continue;
      const val = flatData[applicantType];
      if (val != null) {
        seen.add(project.town);
        result.push({ town: project.town, rate: val, exerciseLabel: ex.label });
      }
    }
  }

  return result.sort((a, b) => a.rate - b.rate);
}

export const CUMULATIVE_TRIES = [1, 2, 3, 4, 5, 8, 10, 15];
