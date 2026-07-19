import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#7c3aed", "#6366f1", "#10b981", "#f59e0b", "#f43f5e"];

export function LeaveDistributionChart({ data }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400">No chart data</p>;

  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendsChart({ data }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400">No trend data</p>;

  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="approved" fill="#10b981" radius={[6, 6, 0, 0]} name="Approved" />
          <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Pending" />
          <Bar dataKey="rejected" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Rejected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
