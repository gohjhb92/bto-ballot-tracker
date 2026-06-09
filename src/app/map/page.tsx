"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { allExercises } from "@/lib/data";
import { getExerciseSummaryStats } from "@/lib/data";
import { competitionLevel } from "@/lib/probability";
import { COMPETITION_COLORS, ESTATE_LABELS, formatRate } from "@/lib/utils";
import type { BtoExercise } from "@/lib/types";
import type { TownAverage } from "@/lib/heatmapUtils";
import { buildTownAverages } from "@/lib/heatmapUtils";

// Leaflet requires browser APIs — load client-side only
const BtoMap = dynamic(() => import("@/components/BtoMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

const BtoHeatMap = dynamic(() => import("@/components/BtoHeatMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  return (
    <div
      className="rounded-xl border border-[#334155] bg-[#1e293b] flex items-center justify-center"
      style={{ height: 480 }}
    >
      <p className="text-slate-500 text-sm">Loading map…</p>
    </div>
  );
}

const sortedExercises = [...allExercises].sort((a, b) =>
  b.id.localeCompare(a.id)
);

// ── Flat type / applicant type options ──────────────────────────────────────

const FLAT_TYPES = ["4-room", "3-room", "5-room", "2-room Flexi"] as const;
const APPLICANT_TYPES = [
  { value: "firstTimer",  label: "1st Timer" },
  { value: "secondTimer", label: "2nd Timer" },
  { value: "singles",     label: "Singles" },
] as const;

// ── Exercise tab ────────────────────────────────────────────────────────────

function ExerciseTab({
  ex, active, onClick,
}: {
  ex: BtoExercise; active: boolean; onClick: () => void;
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

// ── Page ────────────────────────────────────────────────────────────────────

type MapMode = "exercise" | "historical";

export default function MapPage() {
  const [mode, setMode]               = useState<MapMode>("exercise");
  const [selectedId, setSelectedId]   = useState(sortedExercises[0]?.id ?? "");
  const [flatType, setFlatType]       = useState<string>("4-room");
  const [applicantType, setApplicantType] = useState<string>("firstTimer");

  const selectedExercise = useMemo(
    () => sortedExercises.find((e) => e.id === selectedId) ?? sortedExercises[0],
    [selectedId]
  );

  const hasTownData = !!(selectedExercise?.towns?.length);

  // Per-exercise sidebar projects
  const projects = useMemo(() => {
    if (!selectedExercise) return [];
    if (selectedExercise.towns?.length) return selectedExercise.towns;
    if (selectedExercise.summary) {
      return Object.entries(selectedExercise.summary).map(([estateType, flatTypes]) => ({
        town: ESTATE_LABELS[estateType] ?? estateType,
        estateType,
        flatTypes,
      }));
    }
    return [];
  }, [selectedExercise]);

  // Historical sidebar — pre-sorted desc by avgRate
  const historicalTowns: TownAverage[] = useMemo(
    () => buildTownAverages(allExercises, flatType, applicantType),
    [flatType, applicantType]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">BTO Project Map</h1>
          <p className="text-slate-400 text-sm">
            {mode === "exercise"
              ? "Subscription rates per exercise. Select a cohort to see its projects."
              : "Historical average rates across all exercises since Feb 2020."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center bg-[#1e293b] border border-[#334155] rounded-xl p-1 gap-1 shrink-0">
          {(
            [
              { id: "exercise",   label: "By Exercise" },
              { id: "historical", label: "Historical Avg" },
            ] as { id: MapMode; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === id
                  ? "bg-[#EF1826] text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BY-EXERCISE MODE ─────────────────────────────────────────────── */}
      {mode === "exercise" && (
        <>
          {/* Exercise selector */}
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

          {!hasTownData && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 text-sm text-amber-300">
              No per-town project data for this exercise — map shows estate-type
              summary pins.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      ? firstTimerRates.reduce((a, b) => a + b, 0) /
                        firstTimerRates.length
                      : null;
                  const level = avgRate != null ? competitionLevel(avgRate) : null;
                  const color = level ? COMPETITION_COLORS[level] : "#94a3b8";

                  return (
                    <div
                      key={`${p.town}-${p.estateType}`}
                      className="bg-[#1e293b] border border-[#334155] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {(p as { projectName?: string }).projectName ?? p.town}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.town} · {ESTATE_LABELS[p.estateType] ?? p.estateType}
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
                          const r = rates as {
                            firstTimer?: number;
                            secondTimer?: number;
                            singles?: number;
                            seniors?: number;
                          };
                          return (
                            <div
                              key={ft}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-400">{ft}</span>
                              <div className="flex gap-2 flex-wrap justify-end">
                                {r.firstTimer != null && (
                                  <span className="font-mono" style={{ color: COMPETITION_COLORS[competitionLevel(r.firstTimer)] }}>
                                    1st {formatRate(r.firstTimer)}
                                  </span>
                                )}
                                {r.secondTimer != null && (
                                  <span className="text-slate-500 font-mono">
                                    2nd {formatRate(r.secondTimer)}
                                  </span>
                                )}
                                {r.singles != null && (
                                  <span className="font-mono" style={{ color: COMPETITION_COLORS[competitionLevel(r.singles)] }}>
                                    SC {formatRate(r.singles)}
                                  </span>
                                )}
                                {r.seniors != null && (
                                  <span className="text-slate-500 font-mono">
                                    Sr {formatRate(r.seniors)}
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
        </>
      )}

      {/* ── HISTORICAL AVERAGE MODE ──────────────────────────────────────── */}
      {mode === "historical" && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center bg-[#1e293b] border border-[#334155] rounded-xl p-1 gap-1">
              {FLAT_TYPES.map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFlatType(ft)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    flatType === ft
                      ? "bg-[#334155] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-[#1e293b] border border-[#334155] rounded-xl p-1 gap-1">
              {APPLICANT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setApplicantType(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    applicantType === value
                      ? "bg-[#334155] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {historicalTowns.length} towns with {flatType} data
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BtoHeatMap
                exercises={allExercises}
                flatType={flatType}
                applicantType={applicantType}
              />
            </div>

            {/* Historical sidebar — ranked list */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Towns ranked by avg rate
              </h2>
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {historicalTowns.map((t, i) => {
                  const level = competitionLevel(t.avgRate);
                  const color = COMPETITION_COLORS[level];
                  const trendIcon =
                    t.trend === "rising" ? "↑" : t.trend === "falling" ? "↓" : "→";
                  const trendColor =
                    t.trend === "rising"
                      ? "#f87171"
                      : t.trend === "falling"
                      ? "#86efac"
                      : "#64748b";

                  return (
                    <div
                      key={t.town}
                      className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-mono w-5">
                            {i + 1}.
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {t.town}
                          </span>
                          <span style={{ color: trendColor }} className="text-xs font-bold">
                            {trendIcon}
                          </span>
                        </div>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color }}
                        >
                          {formatRate(t.avgRate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pl-7">
                        <span>
                          {t.estateTypes
                            .map((e) => ESTATE_LABELS[e] ?? e)
                            .join(" / ")}
                        </span>
                        <span className="font-mono">
                          {formatRate(t.minRate)}–
                          <span style={{ color: COMPETITION_COLORS[competitionLevel(t.maxRate)] }}>
                            {formatRate(t.maxRate)}
                          </span>
                          <span className="text-slate-600 ml-1">
                            ({t.exerciseCount}ex)
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Trend compares avg rate in the first half vs second half of a town&apos;s
            appearances. Requires ≥4 data points. ↑ rising · ↓ falling · → stable.
          </p>
        </>
      )}

      <p className="text-xs text-slate-600">
        Map uses CartoDB dark tiles. Coordinates are project-site averages where
        available, otherwise town centroids.
      </p>
    </div>
  );
}
