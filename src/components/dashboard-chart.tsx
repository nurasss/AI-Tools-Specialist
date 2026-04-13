"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type ChartPoint = {
  day: string;
  orders: number;
  revenue: number;
};

export function DashboardChart({ data }: { data: ChartPoint[] }) {
  const formatTooltipValue = (value: ValueType | undefined, key: NameType | undefined) => {
    const numericValue =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Array.isArray(value)
            ? Number(value[0] ?? 0)
            : 0;

    return key === "revenue"
      ? `${numericValue.toLocaleString("ru-RU")} ₸`
      : numericValue.toLocaleString("ru-RU");
  };

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,35,32,0.1)" />
          <XAxis
            dataKey="day"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
            }
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            }
          />
          <Legend />
          <Bar yAxisId="left" dataKey="orders" name="Заказы" fill="#d8a974" radius={[8, 8, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            name="Выручка"
            stroke="#0d6b5f"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
