import type { BtoExercise } from "@/lib/types";
import { getExerciseSummaryStats } from "@/lib/data";
import { competitionLevel } from "@/lib/probability";
import { COMPETITION_BG, COMPETITION_COLORS, formatRate } from "@/lib/utils";

interface Props {
  exercise: BtoExercise;
}

export default function ExerciseCard({ exercise }: Props) {
  const { highestRate, lowestRate, avgFirstTimerRate } = getExerciseSummaryStats(exercise);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-[#475569] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{exercise.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {exercise.classification === "SPP"
              ? "Standard / Plus / Prime"
              : "Mature / Non-Mature"}
          </p>
        </div>
        {avgFirstTimerRate != null && (
          <div
            className={`text-xs px-2 py-1 rounded-full border font-mono ${
              COMPETITION_BG[competitionLevel(avgFirstTimerRate)]
            }`}
          >
            {formatRate(avgFirstTimerRate)} avg
          </div>
        )}
      </div>

      {exercise.notes && (
        <p className="text-xs text-slate-400 mb-3 italic">{exercise.notes}</p>
      )}

      <div className="flex gap-4 text-xs">
        {highestRate != null && (
          <div>
            <span className="text-slate-500">Peak: </span>
            <span
              className="font-mono font-bold"
              style={{ color: COMPETITION_COLORS[competitionLevel(highestRate)] }}
            >
              {formatRate(highestRate)}
            </span>
          </div>
        )}
        {lowestRate != null && (
          <div>
            <span className="text-slate-500">Low: </span>
            <span
              className="font-mono font-bold"
              style={{ color: COMPETITION_COLORS[competitionLevel(lowestRate)] }}
            >
              {formatRate(lowestRate)}
            </span>
          </div>
        )}
        {exercise.towns && (
          <div>
            <span className="text-slate-500">Towns: </span>
            <span className="text-slate-300">{exercise.towns.length}</span>
          </div>
        )}
      </div>

      {exercise.summary && (
        <div className="mt-3 pt-3 border-t border-[#334155]">
          <div className="flex flex-wrap gap-1">
            {Object.keys(exercise.summary).map((et) => (
              <span
                key={et}
                className="text-xs bg-[#0b1120] border border-[#334155] text-slate-400 px-2 py-0.5 rounded"
              >
                {et}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
