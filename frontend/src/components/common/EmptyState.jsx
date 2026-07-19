import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data available",
  description = "There are no records to display at this time.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 glass rounded-2xl border border-surface-800/50 my-4">
      <div className="p-4 rounded-2xl bg-surface-800/60 text-surface-400 mb-4">
        <Icon className="w-10 h-10 stroke-1" />
      </div>
      <h3 className="text-lg font-semibold text-surface-200 mb-1">{title}</h3>
      <p className="text-sm text-surface-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-primary-600/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
