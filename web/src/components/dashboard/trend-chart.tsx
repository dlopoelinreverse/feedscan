"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  date: string;
  current: number;
  previous: number;
}

export function TrendChart({
  data,
  currentLabel,
  previousLabel,
  emptyMessage,
}: {
  data: TrendPoint[];
  currentLabel: string;
  previousLabel: string;
  emptyMessage: string;
}) {
  const hasData = data.some((d) => d.current > 0 || d.previous > 0);

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="current"
          name={currentLabel}
          stroke="#6C5CE7"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#6C5CE7" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="previous"
          name={previousLabel}
          stroke="#00B894"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
