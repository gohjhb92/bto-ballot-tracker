import { formatPercent, formatRate } from "@/lib/utils";

interface Props {
  rate: number;
  oddsPerTry: number;
  triesFor80: number;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-[#0b1120] border border-[#334155] rounded-xl p-4 flex-1 min-w-0">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function ProbabilityOutput({ rate, oddsPerTry, triesFor80 }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard
        label="Avg Subscription Rate"
        value={formatRate(rate)}
        sub="last 4 exercises"
      />
      <StatCard
        label="Odds Per Ballot"
        value={formatPercent(oddsPerTry)}
        sub="chance of queue number"
      />
      <StatCard
        label="Tries for 80% Chance"
        value={`${triesFor80}×`}
        sub="cumulative ballots needed"
      />
    </div>
  );
}
