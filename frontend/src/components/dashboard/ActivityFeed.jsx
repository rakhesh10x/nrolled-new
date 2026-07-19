import { Activity } from "lucide-react";
import { formatDateTime } from "../../utils/helpers";
import LeaveStatusBadge from "../leave/LeaveStatusBadge";

export default function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="text-xs text-surface-400 py-4">No recent activity.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => (
        <div
          key={act.id}
          className="flex items-start gap-3 p-3.5 rounded-xl glass border border-surface-800/60 text-xs"
        >
          <div className="p-2 rounded-lg bg-surface-800 text-primary-400 mt-0.5">
            <Activity className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-surface-200 truncate">{act.title}</p>
              <LeaveStatusBadge status={act.status} />
            </div>
            <p className="text-surface-400 mt-0.5">{act.description}</p>
            <p className="text-[10px] text-surface-500 mt-1">
              {formatDateTime(act.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
