import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { BarChart3, Tag } from "lucide-react";
import { Analytics } from "../../types";

type Theme = "light" | "dark";

type AdminOverviewChartsProps = {
  analytics: Analytics | null;
  theme: Theme;
};

const AdminOverviewCharts: React.FC<AdminOverviewChartsProps> = ({ analytics, theme }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
        className={`p-8 rounded-3xl border transition-all ${
          theme === "light"
            ? "bg-white border-slate-200 shadow-lg shadow-slate-200/40"
            : "bg-white/5 backdrop-blur-3xl border-white/10"
        }`}
      >
        <h3
          className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 flex items-center ${
            theme === "light" ? "text-slate-400" : "text-white/40"
          }`}
        >
          <BarChart3 className="h-4 w-4 mr-3 text-indigo-400" />
          Project Status Distribution
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={
                  analytics?.statusCounts?.map((s: any) => ({
                    name: s.status.replace("_", " "),
                    value: s._count,
                  })) || []
                }
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {analytics?.statusCounts?.map((entry: any, index: number) => (
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
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "light" ? "#fff" : "#1a1a1a",
                  borderRadius: "12px",
                  border: `1px solid ${theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`,
                  color: theme === "light" ? "#000" : "#fff",
                }}
                itemStyle={{ color: theme === "light" ? "#000" : "#fff" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: theme === "light" ? "#64748b" : "#94a3b8",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className={`p-8 rounded-3xl border transition-all ${
          theme === "light"
            ? "bg-white border-slate-200 shadow-lg shadow-slate-200/40"
            : "bg-white/5 backdrop-blur-3xl border-white/10"
        }`}
      >
        <h3
          className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 flex items-center ${
            theme === "light" ? "text-slate-400" : "text-white/40"
          }`}
        >
          <Tag className="h-4 w-4 mr-3 text-indigo-400" />
          Projects by Category
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                analytics?.categoryCounts?.map((c: any) => ({
                  name: c.category.replace("_", " "),
                  count: c._count,
                })) || []
              }
              layout="vertical"
              margin={{ left: 40, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke={theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontWeight: 700,
                  fill: theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
                }}
              />
              <Tooltip
                cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}
                contentStyle={{
                  backgroundColor: theme === "light" ? "#fff" : "#1a1a1a",
                  borderRadius: "12px",
                  border: `1px solid ${theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`,
                  color: theme === "light" ? "#000" : "#fff",
                }}
                itemStyle={{ color: theme === "light" ? "#000" : "#fff" }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewCharts;
