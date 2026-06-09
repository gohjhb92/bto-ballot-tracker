"use client";

import { COMPETITION_COLORS, formatRate } from "@/lib/utils";
import { competitionLevel } from "@/lib/probability";

interface Props {
  data: { town: string; rate: number; exerciseLabel: string }[];
}

export default function TownComparison({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <p className="text-slate-500 text-sm">No town-level data for this profile.</p>
      </div>
    );
  }

  const maxRate = Math.max(...data.map((d) => d.rate));

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-1">Town Breakdown</h3>
      <p className="text-xs text-slate-500 mb-4">Most recent available rate per town</p>
      <div className="space-y-3">
        {data.map((d) => {
          const level = competitionLevel(d.rate);
          const color = COMPETITION_COLORS[level];
          const pct = maxRate > 0 ? (d.rate / maxRate) * 100 : 0;
          return (
            <div key={d.town}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-200">{d.town}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{d.exerciseLabel}</span>
                  <span className="font-mono text-sm font-bold" style={{ color }}>
                    {formatRate(d.rate)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[#0b1120] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
