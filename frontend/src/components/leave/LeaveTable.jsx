import LeaveStatusBadge from "./LeaveStatusBadge";
import { formatDate } from "../../utils/helpers";

export default function LeaveTable({
  leaves,
  isAdmin = false,
  onApprove,
  onReject,
  onCancel,
}) {
  if (!leaves || leaves.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-400">
        No leave requests found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl glass-panel border border-slate-800/80 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800 select-none">
            <tr>
              {isAdmin && <th className="p-4">Employee</th>}
              <th className="p-4">Leave Type</th>
              <th className="p-4">Dates</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leaves.map((lr) => (
              <tr
                key={lr.uuid}
                className="hover:bg-slate-800/40 transition-colors duration-150 group"
              >
                {isAdmin && (
                  <td className="p-4 font-bold text-white">
                    <div>{lr.employee_name || "Employee"}</div>
                    <div className="text-[10px] text-purple-400 font-mono font-medium">
                      {lr.emp_id}
                    </div>
                  </td>
                )}
                <td className="p-4 font-semibold text-slate-200">{lr.leave_type}</td>
                <td className="p-4 text-slate-300">
                  {formatDate(lr.start_date)} &mdash; {formatDate(lr.end_date)}
                </td>
                <td className="p-4 font-extrabold text-white">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 font-mono">
                    {lr.days} {lr.days === 1 ? "day" : "days"}
                  </span>
                </td>
                <td className="p-4 max-w-xs truncate text-slate-400" title={lr.reason}>
                  {lr.reason}
                </td>
                <td className="p-4">
                  <LeaveStatusBadge status={lr.status} />
                </td>
                <td className="p-4 text-right">
                  {isAdmin ? (
                    lr.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApprove(lr.uuid)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(lr.uuid)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 font-bold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">
                        {lr.reviewed_by ? `By ${lr.reviewed_by}` : "Processed"}
                      </span>
                    )
                  ) : lr.status === "PENDING" ? (
                    <button
                      onClick={() => onCancel(lr.uuid)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/15 text-rose-400 border border-rose-500/20 hover:bg-rose-600/25 font-bold transition-all"
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
