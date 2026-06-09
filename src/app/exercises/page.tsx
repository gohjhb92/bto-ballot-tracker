"use client";

import { useState, useMemo } from "react";
import ExerciseCard from "@/components/ExerciseCard";
import { allExercises } from "@/lib/data";
import type { FlatType, EstateType } from "@/lib/types";

const ALL_YEARS = Array.from(new Set(allExercises.map((e) => e.year))).sort((a, b) => b - a);
const ALL_FLAT_TYPES: FlatType[] = ["2-room Flexi", "3-room", "4-room", "5-room", "executive"];
const ALL_ESTATE_TYPES: EstateType[] = ["mature", "non-mature", "standard", "plus", "prime"];

export default function ExercisesPage() {
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [flatFilter, setFlatFilter] = useState<FlatType | null>(null);
  const [estateFilter, setEstateFilter] = useState<EstateType | null>(null);

  const filtered = useMemo(() => {
    return allExercises
      .filter((ex) => !yearFilter || ex.year === yearFilter)
      .filter((ex) => {
        if (!flatFilter) return true;
        if (!ex.summary) return false;
        return Object.values(ex.summary).some((est) => flatFilter in est);
      })
      .filter((ex) => {
        if (!estateFilter) return true;
        if (!ex.summary) return false;
        return Object.keys(ex.summary).some(
          (k) => k.toLowerCase() === estateFilter.toLowerCase()
        );
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [yearFilter, flatFilter, estateFilter]);

  function FilterBtn({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          active
            ? "bg-[#EF1826] text-white"
            : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">BTO Exercises Browser</h1>
        <p className="text-slate-400 text-sm">
          All HDB BTO launch exercises from 2020 to present with subscription rates.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-400 mb-2">Year</p>
          <div className="flex flex-wrap gap-2">
            <FilterBtn
              label="All"
              active={yearFilter === null}
              onClick={() => setYearFilter(null)}
            />
            {ALL_YEARS.map((y) => (
              <FilterBtn
                key={y}
                label={String(y)}
                active={yearFilter === y}
                onClick={() => setYearFilter(yearFilter === y ? null : y)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Flat Type</p>
          <div className="flex flex-wrap gap-2">
            <FilterBtn
              label="All"
              active={flatFilter === null}
              onClick={() => setFlatFilter(null)}
            />
            {ALL_FLAT_TYPES.map((ft) => (
              <FilterBtn
                key={ft}
                label={ft}
                active={flatFilter === ft}
                onClick={() => setFlatFilter(flatFilter === ft ? null : ft)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Estate Type</p>
          <div className="flex flex-wrap gap-2">
            <FilterBtn
              label="All"
              active={estateFilter === null}
              onClick={() => setEstateFilter(null)}
            />
            {ALL_ESTATE_TYPES.map((et) => (
              <FilterBtn
                key={et}
                label={et}
                active={estateFilter === et}
                onClick={() => setEstateFilter(estateFilter === et ? null : et)}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No exercises match your filters.
        </div>
      )}
    </div>
  );
}
