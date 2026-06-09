"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { allExercises } from "@/lib/data";
import { getExerciseSummaryStats } from "@/lib/data";
import { competitionLevel } from "@/lib/probability";
import { COMPETITION_COLORS, ESTATE_LABELS, formatRate } from "@/lib/utils";
import type { BtoExercise } from "@/lib/types";

// Leaflet requires browser APIs — load client-side only
const BtoMap = dynamic(() => import("@/components/BtoMap"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-xl border border-[#334155] bg-[#1e293b] flex items-center justify-center"
      style={{ height: 480 }}
    >
      <p className="text-slate-500 text-sm">Loading map…</p>
    </div>
  ),
});

const sortedExercises = [...allExercises].sort((a, b) =>
  b.id.localeCompare(a.id)
);

function ExerciseTab({
  ex,
  active,
  onClick,
}: {
  ex: BtoExercise;
  active: boolean;
  onClick: () => void;
}) {
  const { avgFirstTimerRate } = getExerciseSummaryStats(ex);
  const level = avgFirstTimerRate != null ? competitionLevel(avgFirstTimerRate) : null;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors shrink-0 ${
        active
          ? "border-[#EF1826] bg-[#EF1826]/10"
          : "border-[#334155] bg-[#1e293b] hover:border-[#475569]"
      }`}
    >
      <span className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>
        {ex.label}
      </span>
      <div className="flex items-center gap-1.5 mt-0.5">
        {level && avgFirstTimerRate != null && (
          <>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: COMPETITION_COLORS[level] }}
            />
            <span className="text-xs text-slate-500 font-mono">
              {formatRate(avgFirstTimerRate)}
            </span>
          </>
        )}
        {ex.towns && (
          <span className="text-xs text-slate-600">
            · {ex.towns.length} towns
          </span>
        )}
      </div>
    </button>
  );
}

export default function MapPage() {
  const [selectedId, setSelectedId] = useState(sortedExercises[0]?.id ?? "");

  const selectedExercise = useMemo(
    () => sortedExercises.find((e) => e.id === selectedId) ?? sortedExercises[0],
    [selectedId]
  );

  const hasTownData = !!(selectedExercise?.towns?.length);

  // Build project list for the sidebar
  const projects = useMemo(() => {
    if (!selectedExercise) return [];
    if (selectedExercise.towns?.length) return selectedExercise.towns;
    // Fallback: convert summary to pseudo-projects
    if (selectedExercise.summary) {
      return Object.entries(selectedExercise.summary).map(([estateType, flatTypes]) => ({
        town: ESTATE_LABELS[estateType] ?? estateType,
        estateType,
        flatTypes,
      }));
    }
    return [];
  }, [selectedExercise]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">BTO Project Map</h1>
        <p className="text-slate-400 text-sm">
          Locations and subscription rates for each BTO exercise. Select an
          exercise to see where its projects are and how competitive they were.
        </p>
      </div>

      {/* Exercise selector — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {sortedExercises.map((ex) => (
          <ExerciseTab
            key={ex.id}
            ex={ex}
            active={ex.id === selectedId}
            onClick={() => setSelectedId(ex.id)}
          />
        ))}
      </div>

      {/* Summary fallback notice */}
      {!hasTownData && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 text-sm text-amber-300">
          No per-town project data for this exercise — map shows estate-type
          summary pins. Add a <code className="bg-black/20 px-1 rounded">towns</code> array
          to this exercise in <code className="bg-black/20 px-1 rounded">exercises.json</code> for
          precise project locations.
        </div>
      )}

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          {selectedExercise && (
            <BtoMap exercise={selectedExercise} isSummary={!hasTownData} />
          )}
        </div>

        {/* Project sidebar */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {selectedExercise?.label} · {projects.length} project
            {projects.length !== 1 ? "s" : ""}
          </h2>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {projects.map((p) => {
              const firstTimerRates = Object.values(p.flatTypes)
                .map((r) => (r as { firstTimer?: number }).firstTimer)
                .filter((v): v is number => v != null);
              const avgRate =
                firstTimerRates.length > 0
                  ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
                  : null;
              const level = avgRate != null ? competitionLevel(avgRate) : null;
              const color = level ? COMPETITION_COLORS[level] : "#94a3b8";

              return (
                <div
                  key={p.town}
                  className="bg-[#1e293b] border border-[#334155] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{p.town}</p>
                      <p className="text-xs text-slate-500">
                        {ESTATE_LABELS[p.estateType] ?? p.estateType}
                      </p>
                    </div>
                    {avgRate != null && (
                      <span
                        className="font-mono text-sm font-bold shrink-0"
                        style={{ color }}
                      >
                        {formatRate(avgRate)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {Object.entries(p.flatTypes).map(([ft, rates]) => {
                      const r = rates as { firstTimer?: number; secondTimer?: number; singles?: number };
                      return (
                        <div key={ft} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{ft}</span>
                          <div className="flex gap-2">
                            {r.firstTimer != null && (
                              <span
                                className="font-mono"
                                style={{ color: COMPETITION_COLORS[competitionLevel(r.firstTimer)] }}
                              >
                                {formatRate(r.firstTimer)}
                              </span>
                            )}
                            {r.secondTimer != null && (
                              <span className="text-slate-600 font-mono">
                                2nd {formatRate(r.secondTimer)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      <p className="text-xs text-slate-600">
        Map uses OpenStreetMap / CartoDB dark tiles. Coordinates are town
        centroids — not exact project sites. Circle size scales with avg
        first-timer subscription rate.
      </p>
    </div>
  );
}
