import { Sparkles } from "lucide-react";

export default function SuggestedQuestions({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3 my-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-accent-400" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="text-xs px-3.5 py-2 rounded-xl glass border border-surface-700/50 hover:border-primary-500/50 text-surface-200 hover:text-primary-300 hover:bg-primary-600/10 transition-all duration-200 text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
