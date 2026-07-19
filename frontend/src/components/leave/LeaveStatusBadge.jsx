export default function LeaveStatusBadge({ status }) {
  const s = status ? status.toUpperCase() : "PENDING";

  const styles = {
    PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30 dot-amber",
    APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 dot-emerald",
    REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/30 dot-rose",
    CANCELLED: "bg-slate-500/15 text-slate-400 border-slate-500/30 dot-slate",
  };

  const style = styles[s] || styles.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{s}</span>
    </span>
  );
}
