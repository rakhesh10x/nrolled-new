import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export default function SourceCitation({ sources }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-surface-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Referenced Sources ({sources.length})</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 pl-2">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="text-xs p-2 rounded-lg bg-surface-900/60 border border-surface-800 text-surface-300 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
              <span>{src}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
