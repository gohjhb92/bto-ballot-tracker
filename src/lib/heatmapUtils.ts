import { TOWN_COORDS } from "@/data/townCoordinates";
import type { BtoExercise, FlatTypeRates } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TownAverage {
  town: string;
  lat: number;
  lng: number;
  avgRate: number;
  minRate: number;
  maxRate: number;
  exerciseCount: number;
  trend: "rising" | "falling" | "stable";
  estateTypes: string[];
}

// ── Data builder ────────────────────────────────────────────────────────────

export function buildTownAverages(
  exercises: BtoExercise[],
  flatType: string,
  applicantType: string
): TownAverage[] {
  const townMap: Record<
    string,
    {
      entries: { rate: number; exerciseIndex: number }[];
      lats: number[];
      lngs: number[];
      estateTypes: Set<string>;
    }
  > = {};

  exercises.forEach((ex, idx) => {
    if (!ex.towns) return;
    for (const t of ex.towns) {
      const rates = t.flatTypes[flatType] as FlatTypeRates | undefined;
      const rate =
        applicantType === "firstTimer"
          ? rates?.firstTimer
          : applicantType === "secondTimer"
          ? rates?.secondTimer
          : rates?.singles;
      if (rate == null) continue;

      if (!townMap[t.town]) {
        townMap[t.town] = {
          entries: [],
          lats: [],
          lngs: [],
          estateTypes: new Set(),
        };
      }
      townMap[t.town].entries.push({ rate, exerciseIndex: idx });
      if (t.lat != null) townMap[t.town].lats.push(t.lat);
      if (t.lng != null) townMap[t.town].lngs.push(t.lng);
      townMap[t.town].estateTypes.add(t.estateType);
    }
  });

  return Object.entries(townMap)
    .filter(([, d]) => d.entries.length > 0)
    .map(([town, d]) => {
      const rates = d.entries.map((e) => e.rate);
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;

      // Trend: compare avg of first half vs second half of appearances
      let trend: "rising" | "falling" | "stable" = "stable";
      if (d.entries.length >= 4) {
        const mid = Math.floor(d.entries.length / 2);
        const firstHalf =
          d.entries.slice(0, mid).reduce((a, b) => a + b.rate, 0) / mid;
        const secondHalf =
          d.entries.slice(mid).reduce((a, b) => a + b.rate, 0) /
          (d.entries.length - mid);
        if (secondHalf > firstHalf * 1.25) trend = "rising";
        else if (secondHalf < firstHalf * 0.75) trend = "falling";
      }

      // Coords: average of project-level lat/lngs, fall back to town centroid
      const lat =
        d.lats.length > 0
          ? d.lats.reduce((a, b) => a + b, 0) / d.lats.length
          : (TOWN_COORDS[town] ?? [0, 0])[0];
      const lng =
        d.lngs.length > 0
          ? d.lngs.reduce((a, b) => a + b, 0) / d.lngs.length
          : (TOWN_COORDS[town] ?? [0, 0])[1];

      return {
        town,
        lat,
        lng,
        avgRate: avg,
        minRate: Math.min(...rates),
        maxRate: Math.max(...rates),
        exerciseCount: d.entries.length,
        trend,
        estateTypes: Array.from(d.estateTypes),
      } satisfies TownAverage;
    })
    .filter((t) => t.lat !== 0 && t.lng !== 0)
    .sort((a, b) => b.avgRate - a.avgRate);
}
