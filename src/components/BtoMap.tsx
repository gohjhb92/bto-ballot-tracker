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
  projectName?: string;
  estateType: string;
  flatTypes: Record<string, FlatTypeRates>;
  coords: [number, number];
  primaryRate: number | null;
  isPrecise: boolean; // true = from lat/lng in JSON, false = town centroid fallback
}

function buildProjects(exercise: BtoExercise): MapProject[] {
  if (exercise.towns && exercise.towns.length > 0) {
    return exercise.towns.flatMap((t) => {
      // Use precise project coordinates if available, fall back to town centroid
      const coords: [number, number] | null =
        t.lat != null && t.lng != null
          ? [t.lat, t.lng]
          : TOWN_COORDS[t.town]
          ? TOWN_COORDS[t.town]
          : null;

      if (!coords) return [];

      const isPrecise = t.lat != null && t.lng != null;

      const firstTimerRates = Object.values(t.flatTypes)
        .map((r) => r.firstTimer)
        .filter((v): v is number => v != null);
      const primaryRate =
        firstTimerRates.length > 0
          ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
          : null;

      return [{ town: t.town, projectName: t.projectName, estateType: t.estateType, flatTypes: t.flatTypes, coords, primaryRate, isPrecise }];
    });
  }

  // No town data: drop summary-level pins at estate-type centroids
  const centroids: Record<string, [number, number]> = {
    mature:      [1.3100, 103.8600],
    "non-mature":[1.3800, 103.8200],
    standard:    [1.3800, 103.8000],
    plus:        [1.3200, 103.8500],
    prime:       [1.2980, 103.8450],
  };

  if (exercise.summary) {
    return Object.entries(exercise.summary).flatMap(([estateType, flatTypes]) => {
      const coords = centroids[estateType];
      if (!coords) return [];
      const firstTimerRates = Object.values(flatTypes)
        .map((r) => (r as FlatTypeRates).firstTimer)
        .filter((v): v is number => v != null);
      const primaryRate =
        firstTimerRates.length > 0
          ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
          : null;
      return [{
        town: ESTATE_LABELS[estateType] ?? estateType,
        estateType,
        flatTypes: flatTypes as Record<string, FlatTypeRates>,
        coords,
        primaryRate,
        isPrecise: false,
      }];
    });
  }

  return [];
}

function FitBounds({ projects }: { projects: MapProject[] }) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    const lats = projects.map((p) => p.coords[0]);
    const lngs = projects.map((p) => p.coords[1]);
    map.fitBounds(
      [[Math.min(...lats) - 0.015, Math.min(...lngs) - 0.015],
       [Math.max(...lats) + 0.015, Math.max(...lngs) + 0.015]],
      { animate: true, padding: [32, 32] }
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
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0b1120" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds projects={projects} />

        {projects.map((project) => {
          const level = project.primaryRate != null ? competitionLevel(project.primaryRate) : null;
          const color = level ? COMPETITION_COLORS[level] : "#94a3b8";
          const radius = project.primaryRate != null
            ? Math.max(9, Math.min(24, project.primaryRate * 2.8))
            : 9;

          return (
            <CircleMarker
              key={`${project.town}-${project.projectName ?? ""}`}
              center={project.coords}
              radius={radius}
              pathOptions={{
                color: "#0b1120",
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              <Popup minWidth={220}>
                {/* Dark wrapper fills popup regardless of Leaflet's default white bg */}
                <div style={{
                  fontFamily: "system-ui, sans-serif",
                  background: "#0f172a",
                  margin: "-13px -20px",
                  padding: "14px 16px",
                  borderRadius: "11px",
                }}>
                  {/* Header */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                      {project.projectName ?? project.town}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {project.town}
                      {project.projectName && project.town !== project.projectName ? ` · ` : ""}
                      {ESTATE_LABELS[project.estateType] ?? project.estateType}
                      {!project.isPrecise && isSummary && (
                        <span style={{ color: "#f59e0b", marginLeft: 4 }}>· summary avg</span>
                      )}
                      {!project.isPrecise && !isSummary && (
                        <span style={{ color: "#64748b", marginLeft: 4 }}>· town centroid</span>
                      )}
                    </div>
                  </div>

                  {/* Flat types */}
                  {Object.entries(project.flatTypes).map(([ft, rates]) => {
                    const r = rates as FlatTypeRates;
                    return (
                      <div key={ft} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1", marginBottom: 3 }}>
                          {ft}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 6px" }}>
                          {r.firstTimer != null && (
                            <span style={{ fontSize: 11, color: COMPETITION_COLORS[competitionLevel(r.firstTimer)] }}>
                              1st {formatRate(r.firstTimer)}
                            </span>
                          )}
                          {r.secondTimer != null && (
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              2nd {formatRate(r.secondTimer)}
                            </span>
                          )}
                          {r.singles != null && (
                            <span style={{ fontSize: 11, color: COMPETITION_COLORS[competitionLevel(r.singles)] }}>
                              Singles {formatRate(r.singles)}
                            </span>
                          )}
                          {r.seniors != null && (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              Seniors {formatRate(r.seniors)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer */}
                  {level && project.primaryRate != null && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #1e3a5f", fontSize: 11 }}>
                      <span style={{ color }}>● {COMPETITION_LABEL[level]}</span>
                      <span style={{ color: "#64748b", marginLeft: 6 }}>
                        avg {formatRate(project.primaryRate)} (1st-timer)
                      </span>
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
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COMPETITION_COLORS[lvl] }} />
            <span className="text-slate-400">{COMPETITION_LABEL[lvl]}</span>
            <span className="text-slate-600 ml-auto pl-4">
              {lvl === "low" && "≤1.7×"}
              {lvl === "moderate" && "1.7–4×"}
              {lvl === "high" && "4–8×"}
              {lvl === "extreme" && ">8×"}
            </span>
          </div>
        ))}
        <p className="text-slate-600 pt-1 border-t border-[#334155]">Circle size ∝ subscription rate</p>
      </div>
    </div>
  );
}
