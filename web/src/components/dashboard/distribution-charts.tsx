"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SCORE_COLORS: Record<number, string> = {
  1: "#E24B4A",
  2: "#F09595",
  3: "#FDCB6E",
  4: "#5DCAA5",
  5: "#00B894",
};

const PIE_COLORS = ["#6C5CE7", "#00B894", "#FDCB6E", "#3B82F6", "#EC4899", "#F59E0B"];

export function ScoreDistributionChart({
  data,
  emojiLabels,
}: {
  data: { score: number; count: number }[];
  emojiLabels?: string[];
}) {
  const enriched = data.map((d) => ({
    ...d,
    label: emojiLabels ? emojiLabels[d.score - 1] || `${d.score}` : `${d.score}★`,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={enriched} layout="vertical" margin={{ left: 10, right: 30 }}>
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11 }}>
          {enriched.map((entry) => (
            <Cell key={entry.score} fill={SCORE_COLORS[entry.score]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChoiceDistributionChart({
  data,
}: {
  data: { option: string; count: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">—</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="option"
          cx="50%"
          cy="50%"
          outerRadius={75}
          label={(p: { name?: string }) => p.name || ""}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
