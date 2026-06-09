"use client";

import { allExercises } from "@/lib/data";
import { competitionLevel } from "@/lib/probability";
import {
  COMPETITION_COLORS,
  COMPETITION_BG,
  COMPETITION_LABEL,
  ESTATE_LABELS,
  formatRate,
} from "@/lib/utils";
import type { FlatTypeRates, BtoExercise } from "@/lib/types";

// Most recent exercise by id sort
const currentExercise = [...allExercises].sort((a, b) =>
  b.id.localeCompare(a.id)
)[0];

const APPLICANT_KEYS: { key: keyof FlatTypeRates; label: string }[] = [
  { key: "firstTimer", label: "1st Timer" },
  { key: "secondTimer", label: "2nd Timer" },
  { key: "singles", label: "Singles" },
  { key: "seniors", label: "Seniors" },
];

function RatePill({ rate }: { rate: number }) {
  const level = competitionLevel(rate);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${COMPETITION_BG[level]}`}
    >
      {formatRate(rate)}
    </span>
  );
}

function FlatTypeRow({
  flatType,
  rates,
}: {
  flatType: string;
  rates: FlatTypeRates;
}) {
  const hasAny = APPLICANT_KEYS.some((k) => rates[k.key] != null);
  if (!hasAny) return null;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#334155] last:border-0">
      <span className="text-sm text-slate-300 w-28 shrink-0">{flatType}</span>
      <div className="flex flex-wrap gap-2">
        {APPLICANT_KEYS.filter((k) => rates[k.key] != null).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs text-slate-500">{label}</span>
            <RatePill rate={rates[key]!} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TownCard({
  town,
  estateType,
  flatTypes,
  source,
}: {
  town: string;
  estateType: string;
  flatTypes: Record<string, FlatTypeRates>;
  source: "town" | "summary";
}) {
  const flatEntries = Object.entries(flatTypes);
  const estateLabel = ESTATE_LABELS[estateType] ?? estateType;

  // Determine overall competition from highest firstTimer rate
  const firstTimerRates = flatEntries
    .map(([, r]) => r.firstTimer)
    .filter((v): v is number => v != null);
  const overallRate =
    firstTimerRates.length > 0
      ? firstTimerRates.reduce((a, b) => a + b, 0) / firstTimerRates.length
      : null;
  const level = overallRate != null ? competitionLevel(overallRate) : null;

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-[#475569] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-base">{town}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{estateLabel}</span>
            {source === "summary" && (
              <span className="text-xs bg-[#0b1120] border border-[#334155] text-slate-500 px-1.5 py-0.5 rounded">
                summary avg
              </span>
            )}
          </div>
        </div>
        {level && overallRate != null && (
          <div className="text-right">
            <div
              className="text-xs font-medium"
              style={{ color: COMPETITION_COLORS[level] }}
            >
              {COMPETITION_LABEL[level]}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">avg 1st-timer</div>
          </div>
        )}
      </div>

      <div>
        {flatEntries.map(([ft, rates]) => (
          <FlatTypeRow key={ft} flatType={ft} rates={rates} />
        ))}
      </div>
    </div>
  );
}

function SummaryFallback({ exercise }: { exercise: BtoExercise }) {
  if (!exercise.summary) return null;

  return (
    <div className="space-y-4">
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 text-sm text-amber-300">
        Town-level breakdown not available for this exercise. Showing
        estate-type summary averages.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(exercise.summary).map(([estateType, flatTypes]) => (
          <TownCard
            key={estateType}
            town={ESTATE_LABELS[estateType] ?? estateType}
            estateType={estateType}
            flatTypes={flatTypes}
            source="summary"
          />
        ))}
      </div>
    </div>
  );
}

export default function CurrentPage() {
  const ex = currentExercise;
  const hasTownData = ex.towns && ex.towns.length > 0;

  // Group towns by estate type for display
  const matureTowns =
    ex.towns?.filter((t) =>
      ["mature", "plus", "prime"].includes(t.estateType)
    ) ?? [];
  const nonMatureTowns =
    ex.towns?.filter((t) =>
      ["non-mature", "standard"].includes(t.estateType)
    ) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-[#EF1826]/20 border border-[#EF1826]/40 text-[#EF1826] px-2 py-0.5 rounded-full font-medium">
              Latest Exercise
            </span>
            {ex.classification === "SPP" && (
              <span className="text-xs bg-[#1e293b] border border-[#334155] text-slate-400 px-2 py-0.5 rounded-full">
                Standard / Plus / Prime
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{ex.label} BTO Launch</h1>
          {ex.notes && (
            <p className="text-slate-400 text-sm mt-1 max-w-xl">{ex.notes}</p>
          )}
        </div>

        {/* Legend */}
        <div className="shrink-0 bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-xs space-y-1.5">
          <p className="text-slate-400 font-medium mb-2">Competition Scale</p>
          {(["low", "moderate", "high", "extreme"] as const).map((lvl) => (
            <div key={lvl} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COMPETITION_COLORS[lvl] }}
              />
              <span className="text-slate-400">{COMPETITION_LABEL[lvl]}</span>
              <span className="text-slate-600 ml-auto">
                {lvl === "low" && "≤1.7×"}
                {lvl === "moderate" && "1.7–4×"}
                {lvl === "high" && "4–8×"}
                {lvl === "extreme" && ">8×"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {hasTownData ? (
        <div className="space-y-8">
          {/* Mature / Plus / Prime towns */}
          {matureTowns.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                {ex.classification === "SPP"
                  ? "Plus / Prime"
                  : "Mature Estates"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matureTowns.map((project) => (
                  <TownCard
                    key={project.town}
                    town={project.town}
                    estateType={project.estateType}
                    flatTypes={project.flatTypes}
                    source="town"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Non-mature / Standard towns */}
          {nonMatureTowns.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                {ex.classification === "SPP"
                  ? "Standard"
                  : "Non-Mature Estates"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nonMatureTowns.map((project) => (
                  <TownCard
                    key={project.town}
                    town={project.town}
                    estateType={project.estateType}
                    flatTypes={project.flatTypes}
                    source="town"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <SummaryFallback exercise={ex} />
      )}

      {/* How to read */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300 text-sm mb-2">How to read this</p>
        <p>
          Each rate shows how many applicants competed per available unit.{" "}
          <span className="text-green-400 font-mono">1.7×</span> is HDB&apos;s
          threshold — at or below this, most applicants receive a queue number.
        </p>
        <p className="mt-1">
          Rates are published by HDB after each exercise closes. Update{" "}
          <code className="bg-[#0b1120] px-1 rounded text-slate-300">
            src/data/exercises.json
          </code>{" "}
          with the new exercise to refresh this page.
        </p>
      </div>
    </div>
  );
}
