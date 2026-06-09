import type { CompetitionLevel } from "@/lib/types";
import { COMPETITION_BG, COMPETITION_LABEL, formatRate } from "@/lib/utils";

interface Props {
  level: CompetitionLevel;
  rate: number;
  applicantType?: string;
}

const VERDICT_TEXT: Record<CompetitionLevel, string> = {
  low: "Good odds. Most applicants receive a queue number.",
  moderate: "Fair odds. Expect a 1-in-4 chance each ballot.",
  high: "Tough. May take several attempts. Consider alternatives.",
  extreme: "Very competitive. Second-timers face very long odds.",
};

const VERDICT_EMOJI: Record<CompetitionLevel, string> = {
  low: "✓",
  moderate: "~",
  high: "!",
  extreme: "✗",
};

export default function VerdictBadge({ level, rate, applicantType }: Props) {
  return (
    <div className={`rounded-xl border p-5 ${COMPETITION_BG[level]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold font-mono">{VERDICT_EMOJI[level]}</span>
            <span className="text-base font-semibold">{COMPETITION_LABEL[level]}</span>
          </div>
          <p className="text-sm opacity-80">{VERDICT_TEXT[level]}</p>
          {applicantType === "firstTimer" && (
            <p className="text-xs mt-2 opacity-60">
              As a first-timer, you receive 2 ballot chances per exercise.
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-mono font-bold">{formatRate(rate)}</div>
          <div className="text-xs opacity-60 mt-0.5">avg subscription rate</div>
        </div>
      </div>
    </div>
  );
}
