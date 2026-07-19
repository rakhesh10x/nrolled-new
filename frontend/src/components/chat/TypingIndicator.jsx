export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl glass max-w-xs text-surface-400 bg-surface-900/60">
      <span className="w-2 h-2 rounded-full bg-primary-400 typing-dot" />
      <span className="w-2 h-2 rounded-full bg-primary-400 typing-dot" />
      <span className="w-2 h-2 rounded-full bg-primary-400 typing-dot" />
      <span className="text-xs text-surface-400 font-medium ml-2">HR Assistant is typing...</span>
    </div>
  );
}
