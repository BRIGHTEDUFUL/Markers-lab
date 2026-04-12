import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Theme = "light" | "dark";

type ChartEntry = {
  name: string;
  value: number;
  status: string;
};

type DashboardStatusChartProps = {
  chartData: ChartEntry[];
  theme: Theme;
};

const DashboardStatusChart: React.FC<DashboardStatusChartProps> = ({ chartData, theme }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={10}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.status === "COMPLETED"
                  ? "#22c55e"
                  : entry.status === "PENDING"
                    ? "#eab308"
                    : entry.status === "IN_PROGRESS"
                      ? "#6366f1"
                      : entry.status === "IN_REVIEW"
                        ? "#3b82f6"
                        : "#ef4444"
              }
              stroke={theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
              strokeWidth={4}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "light" ? "#fff" : "#0a0a0a",
            borderRadius: "24px",
            border: theme === "light" ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.2)",
            padding: "20px",
          }}
          itemStyle={{
            color: theme === "light" ? "#0f172a" : "#fff",
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DashboardStatusChart;
