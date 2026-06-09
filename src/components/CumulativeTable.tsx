import { cumulativeOdds, CUMULATIVE_TRIES } from "@/lib/probability";
import { formatPercent } from "@/lib/utils";

interface Props {
  rate: number;
}

export default function CumulativeTable({ rate }: Props) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Cumulative Probability Table
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#334155]">
            <th className="text-left text-slate-400 font-medium py-2 pr-4">Ballots</th>
            <th className="text-left text-slate-400 font-medium py-2 pr-4">Cumulative Chance</th>
            <th className="text-left text-slate-400 font-medium py-2">Visual</th>
          </tr>
        </thead>
        <tbody>
          {CUMULATIVE_TRIES.map((n) => {
            const prob = cumulativeOdds(rate, n);
            const pct = prob * 100;
            return (
              <tr key={n} className="border-b border-[#1e293b] hover:bg-[#0b1120]/50">
                <td className="py-2 pr-4 font-mono text-slate-200">{n}</td>
                <td className="py-2 pr-4 font-mono font-bold text-white">
                  {formatPercent(prob)}
                </td>
                <td className="py-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-[#0b1120] rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct >= 80
                              ? "#86efac"
                              : pct >= 50
                              ? "#fcd34d"
                              : "#fca5a5",
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-3">
        Based on avg subscription rate of {rate.toFixed(1)}× over the last 4 exercises.
      </p>
    </div>
  );
}
