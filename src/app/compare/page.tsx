"use client";

import { useState, useMemo } from "react";
import { allExercises } from "@/lib/data";
import { buildTrendData, competitionLevel, recentAverageRate } from "@/lib/probability";
import { COMPETITION_COLORS, COMPETITION_LABEL, ESTATE_LABELS, formatRate } from "@/lib/utils";
import TrendChart from "@/components/TrendChart";
import type { ApplicantType, EstateType, FlatType } from "@/lib/types";

const ESTATE_TYPES: EstateType[] = ["mature", "non-mature", "standard", "plus", "prime"];
const FLAT_TYPES: FlatType[] = ["2-room Flexi", "3-room", "4-room", "5-room", "executive"];
const APPLICANT_TYPES: ApplicantType[] = ["firstTimer", "secondTimer", "singles"];

export default function ComparePage() {
  const [flatType, setFlatType] = useState<FlatType>("4-room");
  const [applicantType, setApplicantType] = useState<ApplicantType>("firstTimer");

  const comparisons = useMemo(() => {
    return ESTATE_TYPES.map((et) => {
      const rate = recentAverageRate(allExercises, flatType, et, applicantType);
      const trend = buildTrendData(allExercises, flatType, et, applicantType);
      return { estateType: et, rate, trend };
    }).filter((c) => c.rate !== null);
  }, [flatType, applicantType]);

  const sorted = [...comparisons].sort((a, b) => (a.rate ?? 999) - (b.rate ?? 999));

  function SelectBtn<T extends string>({
    options,
    value,
    onChange,
    label,
  }: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
    label: string;
  }) {
    return (
      <div>
        <p className="text-xs text-slate-400 mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                value === o
                  ? "bg-[#EF1826] text-white"
                  : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Town &amp; Estate Comparison</h1>
        <p className="text-slate-400 text-sm">
          Compare subscription rates across estate types side-by-side.
        </p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
        <SelectBtn
          label="Flat Type"
          options={FLAT_TYPES}
          value={flatType}
          onChange={(v) => {
            setFlatType(v);
            if (v === "2-room Flexi") setApplicantType("singles");
          }}
        />
        <SelectBtn
          label="Applicant Type"
          options={APPLICANT_TYPES}
          value={applicantType}
          onChange={setApplicantType}
        />
      </div>

      {/* Ranked list */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Estate Types Ranked (Best Odds First)
        </h2>
        <div className="space-y-4">
          {sorted.map((c, i) => {
            const level = competitionLevel(c.rate!);
            const color = COMPETITION_COLORS[level];
            const maxRate = sorted[sorted.length - 1]?.rate ?? 1;
            const pct = maxRate > 0 ? ((c.rate ?? 0) / maxRate) * 100 : 0;
            return (
              <div key={c.estateType}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                    <span className="text-sm text-slate-200 font-medium">
                      {ESTATE_LABELS[c.estateType]}
                    </span>
                    <span className="text-xs text-slate-500">{COMPETITION_LABEL[level]}</span>
                  </div>
                  <span className="font-mono font-bold text-sm" style={{ color }}>
                    {formatRate(c.rate!)}
                  </span>
                </div>
                <div className="h-2 bg-[#0b1120] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              No data available for this combination.
            </p>
          )}
        </div>
      </div>

      {/* Trend charts */}
      {sorted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Historical Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sorted.map((c) => (
              <TrendChart
                key={c.estateType}
                data={c.trend}
                title={`${ESTATE_LABELS[c.estateType]} — ${flatType}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* SPP explainer */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">
          Standard / Plus / Prime Classification (Oct 2024 onwards)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#0b1120] rounded-lg p-4 border border-[#334155]">
            <p className="font-semibold text-green-400 mb-2">Standard</p>
            <p className="text-slate-400">
              Broadly equivalent to old non-mature estates. Fewest resale restrictions.
              Standard MOP of 5 years.
            </p>
          </div>
          <div className="bg-[#0b1120] rounded-lg p-4 border border-[#334155]">
            <p className="font-semibold text-amber-400 mb-2">Plus</p>
            <p className="text-slate-400">
              Well-located flats in choicer non-mature areas. 10-year MOP, subsidy clawback
              on resale, income ceiling applies.
            </p>
          </div>
          <div className="bg-[#0b1120] rounded-lg p-4 border border-[#334155]">
            <p className="font-semibold text-red-400 mb-2">Prime</p>
            <p className="text-slate-400">
              Most central locations (e.g. city fringe, mature town centres). Tightest
              restrictions: 10-year MOP, higher subsidy clawback, cannot rent out entire flat.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Pre-Oct 2024 exercises used the mature / non-mature classification. The old mature
          estates roughly map to Plus/Prime; non-mature maps to Standard.
        </p>
      </div>
    </div>
  );
}
