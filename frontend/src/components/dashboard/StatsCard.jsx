export default function StatsCard({ title, value, subtitle, icon: Icon, color = "purple", onClick }) {
  const gradients = {
    purple: "from-purple-600 to-indigo-600 text-purple-300 shadow-purple-600/20",
    indigo: "from-indigo-600 to-blue-600 text-indigo-300 shadow-indigo-600/20",
    emerald: "from-emerald-600 to-teal-600 text-emerald-300 shadow-emerald-600/20",
    amber: "from-amber-600 to-orange-600 text-amber-300 shadow-amber-600/20",
    rose: "from-rose-600 to-pink-600 text-rose-300 shadow-rose-600/20",
  };

  const style = gradients[color] || gradients.purple;

  return (
    <div
      onClick={onClick}
      className={`glass-card p-6 border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/50 transition-all duration-300 group ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl hover:shadow-purple-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${style} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      )}

      {onClick && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
          <span>View Detailed Breakdown</span>
          <span>&rarr;</span>
        </div>
      )}
    </div>
  );
}
