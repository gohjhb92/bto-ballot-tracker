"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TOWN_COORDS } from "@/data/townCoordinates";
import { competitionLevel } from "@/lib/probability";
import { COMPETITION_COLORS, COMPETITION_LABEL, ESTATE_LABELS, formatRate } from "@/lib/utils";
import type { BtoExercise, FlatTypeRates } from "@/lib/types";

interface MapProject {
  town: string;
  estateType: string;
  flatTypes: Record<string, FlatTypeRates>;
  coords: [number, number];
  primaryRate: number | null;
}

function buildProjects(exercise: BtoExercise): MapProject[] {
  const projects: MapProject[] = [];

  if (exercise.towns && exercise.towns.length > 0) {
    for (const t of exercise.towns) {
      const coords = TOWN_COORDS[t.town];
      if (!coords) continue;
      const firstTimerRates = Object.values(t.flatTypes)
        .map((r) => r.firstTimer)
        .filter((v): v is number => v != null);
      const primaryRate =
        firstTimerRates.length > 0
          ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
          : null;
      projects.push({ town: t.town, estateType: t.estateType, flatTypes: t.flatTypes, coords, primaryRate });
    }
    return projects;
  }

  // Fallback: use summary, one "virtual" pin per estate type centroid
  if (exercise.summary) {
    const centroids: Record<string, [number, number]> = {
      mature: [1.3100, 103.8600],
      "non-mature": [1.3800, 103.8200],
      standard: [1.3800, 103.8000],
      plus: [1.3200, 103.8500],
      prime: [1.2980, 103.8450],
    };
    for (const [estateType, flatTypes] of Object.entries(exercise.summary)) {
      const coords = centroids[estateType];
      if (!coords) continue;
      const firstTimerRates = Object.values(flatTypes)
        .map((r) => (r as FlatTypeRates).firstTimer)
        .filter((v): v is number => v != null);
      const primaryRate =
        firstTimerRates.length > 0
          ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
          : null;
      projects.push({
        town: ESTATE_LABELS[estateType] ?? estateType,
        estateType,
        flatTypes: flatTypes as Record<string, FlatTypeRates>,
        coords,
        primaryRate,
      });
    }
  }

  return projects;
}

// Re-fit bounds when exercise changes
function FitBounds({ projects }: { projects: MapProject[] }) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    const lats = projects.map((p) => p.coords[0]);
    const lngs = projects.map((p) => p.coords[1]);
    map.fitBounds(
      [[Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
       [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02]],
      { animate: true, padding: [20, 20] }
    );
  }, [projects, map]);
  return null;
}

interface Props {
  exercise: BtoExercise;
  isSummary: boolean;
}

export default function BtoMap({ exercise, isSummary }: Props) {
  const projects = buildProjects(exercise);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#334155]" style={{ height: 480 }}>
      <MapContainer
        center={[1.3521, 103.8198]}
        zoom={11}
        style={{ height: "100%", width: "100%", background: "#0b1120" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds projects={projects} />

        {projects.map((project) => {
          const level = project.primaryRate != null ? competitionLevel(project.primaryRate) : null;
          const color = level ? COMPETITION_COLORS[level] : "#94a3b8";
          const radius = project.primaryRate != null
            ? Math.max(8, Math.min(22, project.primaryRate * 2.5))
            : 8;

          return (
            <CircleMarker
              key={project.town}
              center={project.coords}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {project.town}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                    {ESTATE_LABELS[project.estateType] ?? project.estateType}
                    {isSummary && " · summary avg"}
                  </div>
                  {Object.entries(project.flatTypes).map(([ft, rates]) => {
                    const r = rates as FlatTypeRates;
                    return (
                      <div key={ft} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                          {ft}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {r.firstTimer != null && (
                            <span style={{ fontSize: 11, background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: COMPETITION_COLORS[competitionLevel(r.firstTimer)] }}>
                              1st {formatRate(r.firstTimer)}
                            </span>
                          )}
                          {r.secondTimer != null && (
                            <span style={{ fontSize: 11, background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: COMPETITION_COLORS[competitionLevel(r.secondTimer)] }}>
                              2nd {formatRate(r.secondTimer)}
                            </span>
                          )}
                          {r.singles != null && (
                            <span style={{ fontSize: 11, background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: COMPETITION_COLORS[competitionLevel(r.singles)] }}>
                              Singles {formatRate(r.singles)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {level && project.primaryRate != null && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #334155", fontSize: 11, color: color }}>
                      {COMPETITION_LABEL[level]} · avg {formatRate(project.primaryRate)} (1st-timer)
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0b1120]/90 border border-[#334155] rounded-xl p-3 text-xs space-y-1.5 backdrop-blur">
        <p className="text-slate-400 font-semibold mb-2">Avg 1st-timer rate</p>
        {(["low", "moderate", "high", "extreme"] as const).map((lvl) => (
          <div key={lvl} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COMPETITION_COLORS[lvl] }} />
            <span className="text-slate-400">{COMPETITION_LABEL[lvl]}</span>
          </div>
        ))}
        <p className="text-slate-600 pt-1">Circle size ∝ rate</p>
      </div>
    </div>
  );
}
