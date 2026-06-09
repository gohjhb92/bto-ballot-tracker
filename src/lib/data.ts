import rawData from "@/data/exercises.json";
import type { BtoExercise, FlatType, EstateType, ApplicantType } from "./types";

export const allExercises: BtoExercise[] = rawData.exercises as unknown as BtoExercise[];

export function getExercise(id: string): BtoExercise | undefined {
  return allExercises.find((ex) => ex.id === id);
}

export function getExercisesByYear(year: number): BtoExercise[] {
  return allExercises.filter((ex) => ex.year === year);
}

export function getAvailableEstateTypes(exerciseId?: string): string[] {
  const exercises = exerciseId
    ? allExercises.filter((e) => e.id === exerciseId)
    : allExercises;

  const types = new Set<string>();
  for (const ex of exercises) {
    if (ex.summary) {
      Object.keys(ex.summary).forEach((k) => types.add(k));
    }
  }
  return Array.from(types);
}

export function getAvailableFlatTypes(estateType: string): FlatType[] {
  const types = new Set<string>();
  for (const ex of allExercises) {
    if (!ex.summary) continue;
    const key = Object.keys(ex.summary).find(
      (k) => k.toLowerCase() === estateType.toLowerCase()
    );
    if (!key) continue;
    Object.keys(ex.summary[key]).forEach((ft) => types.add(ft));
  }
  return Array.from(types) as FlatType[];
}

export function getRatesForProfile(
  flatType: FlatType,
  estateType: EstateType,
  applicantType: ApplicantType
): { exercise: BtoExercise; rate: number }[] {
  const result: { exercise: BtoExercise; rate: number }[] = [];

  for (const ex of allExercises) {
    if (!ex.summary) continue;
    const key = Object.keys(ex.summary).find(
      (k) => k.toLowerCase() === estateType.toLowerCase()
    );
    if (!key) continue;
    const flatData = ex.summary[key][flatType];
    if (!flatData) continue;
    const val = flatData[applicantType];
    if (val != null) {
      result.push({ exercise: ex, rate: val });
    }
  }

  return result.sort((a, b) => a.exercise.id.localeCompare(b.exercise.id));
}

export function getExerciseSummaryStats(ex: BtoExercise): {
  highestRate: number | null;
  lowestRate: number | null;
  avgFirstTimerRate: number | null;
} {
  const rates: number[] = [];

  if (ex.summary) {
    for (const estateData of Object.values(ex.summary)) {
      for (const flatData of Object.values(estateData)) {
        const ft = flatData as Record<string, number>;
        Object.values(ft).forEach((v) => {
          if (typeof v === "number") rates.push(v);
        });
      }
    }
  }

  if (rates.length === 0) return { highestRate: null, lowestRate: null, avgFirstTimerRate: null };

  const firstTimerRates: number[] = [];
  if (ex.summary) {
    for (const estateData of Object.values(ex.summary)) {
      for (const flatData of Object.values(estateData)) {
        const ft = flatData as Record<string, number | undefined>;
        if (ft.firstTimer != null) firstTimerRates.push(ft.firstTimer);
      }
    }
  }

  return {
    highestRate: Math.max(...rates),
    lowestRate: Math.min(...rates),
    avgFirstTimerRate:
      firstTimerRates.length > 0
        ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
        : null,
  };
}

export const ESTATE_TYPES_LEGACY: EstateType[] = ["mature", "non-mature"];
export const ESTATE_TYPES_SPP: EstateType[] = ["standard", "plus", "prime"];
export const ALL_ESTATE_TYPES: EstateType[] = [
  "mature",
  "non-mature",
  "standard",
  "plus",
  "prime",
];
export const ALL_FLAT_TYPES: FlatType[] = [
  "2-room Flexi",
  "3-room",
  "4-room",
  "5-room",
  "executive",
];
