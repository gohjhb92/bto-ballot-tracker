"use client";

import { useState } from "react";
import ProfileSelector from "@/components/ProfileSelector";
import ProbabilityOutput from "@/components/ProbabilityOutput";
import VerdictBadge from "@/components/VerdictBadge";
import TrendChart from "@/components/TrendChart";
import TownComparison from "@/components/TownComparison";
import CumulativeTable from "@/components/CumulativeTable";
import type { ProfileSelection } from "@/lib/types";
import { allExercises } from "@/lib/data";
import { ESTATE_LABELS, APPLICANT_LABELS } from "@/lib/utils";
import {
  recentAverageRate,
  oddsPerTry,
  triesForTarget,
  competitionLevel,
  buildTrendData,
  buildTownRates,
} from "@/lib/probability";

const DEFAULT_PROFILE: ProfileSelection = {
  applicantType: "firstTimer",
  flatType: "4-room",
  estateType: "mature",
};

export default function HomePage() {
  const [profile, setProfile] = useState<ProfileSelection>(DEFAULT_PROFILE);

  const rate = recentAverageRate(
    allExercises,
    profile.flatType,
    profile.estateType,
    profile.applicantType
  );

  const trendData = buildTrendData(
    allExercises,
    profile.flatType,
    profile.estateType,
    profile.applicantType
  );

  const townData = buildTownRates(
    allExercises,
    profile.flatType,
    profile.estateType,
    profile.applicantType
  );

  const hasData = rate !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">BTO Ballot Odds Calculator</h1>
        <p className="text-slate-400 text-sm">
          Estimate your ballot odds based on historical HDB BTO subscription rates.
          Select your profile to see your chances.
        </p>
      </div>

      {/* Profile */}
      <ProfileSelector value={profile} onChange={setProfile} />

      {/* Results */}
      {!hasData ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center">
          <p className="text-slate-400">
            No historical data available for{" "}
            <strong className="text-slate-200">{profile.applicantType}</strong> /{" "}
            <strong className="text-slate-200">{profile.flatType}</strong> in{" "}
            <strong className="text-slate-200">{profile.estateType}</strong> estates.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Try a different combination — not all flat types appear in every estate category.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verdict */}
          <VerdictBadge
            level={competitionLevel(rate)}
            rate={rate}
            applicantType={profile.applicantType}
          />

          {/* Key stats */}
          <ProbabilityOutput
            rate={rate}
            oddsPerTry={oddsPerTry(rate)}
            triesFor80={triesForTarget(rate, 0.8)}
          />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              data={trendData}
              title={`${profile.flatType} · ${ESTATE_LABELS[profile.estateType] ?? profile.estateType} · ${APPLICANT_LABELS[profile.applicantType] ?? profile.applicantType}`}
            />
            <TownComparison data={townData} />
          </div>

          {/* Cumulative table */}
          <CumulativeTable rate={rate} />

          {/* Info callout */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 text-sm text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">How this works</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                Subscription rate = applications ÷ available units. A rate of 3× means 3
                applicants per flat.
              </li>
              <li>
                HDB&apos;s published guidance: rates at or below{" "}
                <span className="text-green-400 font-mono">1.7×</span> mean most applicants
                receive a queue number.
              </li>
              <li>
                First-timers receive <strong className="text-slate-200">2 ballot chances</strong>{" "}
                per exercise; second-timers receive 1.
              </li>
              <li>
                From Aug 2023: first-timers who decline their ballot are treated as
                second-timers for 1 year. After a second decline, they are barred for 1 year.
              </li>
              <li>
                From Oct 2024: HDB replaced mature/non-mature with{" "}
                <strong className="text-slate-200">Standard / Plus / Prime</strong>.
                Pre-Oct 2024 data uses the old labels.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
