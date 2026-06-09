"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { COMPETITION_COLORS } from "@/lib/utils";

interface Props {
  data: { label: string; rate: number }[];
  title?: string;
}

function rateColor(rate: number): string {
  if (rate <= 1.7) return COMPETITION_COLORS.low;
  if (rate <= 4.0) return COMPETITION_COLORS.moderate;
  if (rate <= 8.0) return COMPETITION_COLORS.high;
  return COMPETITION_COLORS.extreme;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={rateColor(payload.rate)}
      stroke="#0b1120"
      strokeWidth={1.5}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value as number;
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-mono font-bold" style={{ color: rateColor(rate) }}>
        {rate.toFixed(1)}× subscription
      </p>
    </div>
  );
}

export default function TrendChart({ data, title }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">No historical data for this profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        {title ?? "Historical Subscription Rate"}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}×`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={1.7}
            stroke="#86efac"
            strokeDasharray="4 4"
            label={{ value: "1.7× HDB threshold", fill: "#86efac", fontSize: 10, position: "insideTopLeft" }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#EF1826"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#EF1826" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
