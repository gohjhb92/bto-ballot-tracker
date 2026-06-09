"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TOWN_COORDS } from "@/data/townCoordinates";
import { competitionLevel } from "@/lib/probability";
import {
  COMPETITION_COLORS,
  COMPETITION_LABEL,
  ESTATE_LABELS,
  formatRate,
} from "@/lib/utils";
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

// ── FitBounds helper ────────────────────────────────────────────────────────

function FitBounds({ towns }: { towns: TownAverage[] }) {
  const map = useMap();
  useEffect(() => {
    if (towns.length === 0) return;
    const lats = towns.map((t) => t.lat);
    const lngs = towns.map((t) => t.lng);
    map.fitBounds(
      [
        [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
        [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02],
      ],
      { animate: false, padding: [40, 40] }
    );
  }, [towns, map]);
  return null;
}

// ── Trend badge ─────────────────────────────────────────────────────────────

const TREND_META = {
  rising:  { icon: "↑", label: "Getting more competitive", color: "#f87171" },
  falling: { icon: "↓", label: "Getting less competitive", color: "#86efac" },
  stable:  { icon: "→", label: "Broadly stable",           color: "#94a3b8" },
};

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  exercises: BtoExercise[];
  flatType: string;
  applicantType: string;
}

export default function BtoHeatMap({ exercises, flatType, applicantType }: Props) {
  const towns = useMemo(
    () => buildTownAverages(exercises, flatType, applicantType),
    [exercises, flatType, applicantType]
  );

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-[#334155]"
      style={{ height: 480 }}
    >
      <MapContainer
        center={[1.3521, 103.8198]}
        zoom={11}
        style={{ height: "100%", width: "100%", background: "#0b1120" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds towns={towns} />

        {towns.map((t) => {
          const level = competitionLevel(t.avgRate);
          const color = COMPETITION_COLORS[level];
          const radius = Math.max(10, Math.min(30, t.avgRate * 3));
          const trend = TREND_META[t.trend];

          return (
            <CircleMarker
              key={t.town}
              center={[t.lat, t.lng]}
              radius={radius}
              pathOptions={{
                color: "#0b1120",
                fillColor: color,
                fillOpacity: 0.82,
                weight: 1.5,
              }}
            >
              <Popup minWidth={230}>
                <div style={{ fontFamily: "system-ui, sans-serif" }}>
                  {/* Header */}
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span>{t.town}</span>
                      <span style={{ color, fontFamily: "monospace" }}>
                        {formatRate(t.avgRate)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                      {t.estateTypes
                        .map((e) => ESTATE_LABELS[e] ?? e)
                        .join(" / ")}
                      {" · "}
                      {t.exerciseCount} exercise
                      {t.exerciseCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Rate stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 6,
                      marginBottom: 10,
                      padding: "8px 0",
                      borderTop: "1px solid #334155",
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    {[
                      { label: "Avg", val: t.avgRate, color },
                      { label: "Best", val: t.minRate, color: COMPETITION_COLORS[competitionLevel(t.minRate)] },
                      { label: "Worst", val: t.maxRate, color: COMPETITION_COLORS[competitionLevel(t.maxRate)] },
                    ].map(({ label, val, color: c }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "monospace" }}>
                          {formatRate(val)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trend */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: trend.color,
                      }}
                    >
                      {trend.icon}
                    </span>
                    <span style={{ color: "#94a3b8" }}>{trend.label}</span>
                  </div>

                  {/* Competition level footer */}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px solid #1e293b",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color }}>● {COMPETITION_LABEL[level]}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0b1120]/90 border border-[#334155] rounded-xl p-3 text-xs space-y-1.5 backdrop-blur">
        <p className="text-slate-400 font-semibold mb-2">
          Avg 1st-timer rate (all exercises)
        </p>
        {(["low", "moderate", "high", "extreme"] as const).map((lvl) => (
          <div key={lvl} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COMPETITION_COLORS[lvl] }}
            />
            <span className="text-slate-400">{COMPETITION_LABEL[lvl]}</span>
            <span className="text-slate-600 ml-auto pl-4">
              {lvl === "low" && "≤1.7×"}
              {lvl === "moderate" && "1.7–4×"}
              {lvl === "high" && "4–8×"}
              {lvl === "extreme" && ">8×"}
            </span>
          </div>
        ))}
        <div className="pt-1 border-t border-[#334155] space-y-1">
          <p className="text-slate-600">Circle size ∝ avg rate</p>
          <div className="flex gap-3">
            {(["rising", "falling", "stable"] as const).map((tr) => (
              <span key={tr} style={{ color: TREND_META[tr].color }} className="font-bold">
                {TREND_META[tr].icon}
              </span>
            ))}
          </div>
          <p className="text-slate-600">↑ rising · ↓ falling · → stable</p>
        </div>
      </div>
    </div>
  );
}
