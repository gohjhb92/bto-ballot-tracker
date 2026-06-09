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
import { competitionLevel } from "@/lib/probability";
import {
  COMPETITION_COLORS,
  COMPETITION_LABEL,
  ESTATE_LABELS,
  formatRate,
} from "@/lib/utils";
import type { BtoExercise } from "@/lib/types";
import type { TownAverage } from "@/lib/heatmapUtils";
import { buildTownAverages } from "@/lib/heatmapUtils";

export type { TownAverage };
export { buildTownAverages };

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
                {/* Dark wrapper — fills the popup regardless of Leaflet's default white bg */}
                <div style={{
                  fontFamily: "system-ui, sans-serif",
                  background: "#0f172a",
                  margin: "-13px -20px",
                  padding: "14px 16px",
                  borderRadius: "11px",
                  minWidth: 220,
                }}>
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
                      borderTop: "1px solid #1e3a5f",
                      borderBottom: "1px solid #1e3a5f",
                    }}
                  >
                    {[
                      { label: "Avg",   val: t.avgRate, color },
                      { label: "Best",  val: t.minRate, color: COMPETITION_COLORS[competitionLevel(t.minRate)] },
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: trend.color }}>
                      {trend.icon}
                    </span>
                    <span style={{ color: "#94a3b8" }}>{trend.label}</span>
                  </div>

                  {/* Competition level footer */}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px solid #1e3a5f",
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
