import { useState, useRef, useEffect } from "react";
import { Send, StopCircle } from "lucide-react";

export default function ChatInput({ onSend, disabled, isStreaming, onStop }) {
  const [content, setContent] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [content]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center glass rounded-2xl border border-surface-700/60 shadow-xl bg-surface-900/90 focus-within:border-primary-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask HR Assistant anything (e.g., How many leaves do I have left?)..."
          rows={1}
          disabled={disabled && !isStreaming}
          className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-surface-100 placeholder-surface-400 focus:outline-none resize-none max-h-40"
        />

        <div className="absolute right-2 bottom-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-xl bg-error-500/20 text-error-500 hover:bg-error-500/30 transition-colors"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!content.trim() || disabled}
              className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 text-white transition-all duration-200 shadow-md shadow-primary-600/20"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-surface-400 text-center mt-2">
        Press <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700">Shift + Enter</kbd> for new line.
      </p>
    </form>
  );
}
