import { useState } from "react";
import { Copy, Check, Bot, User } from "lucide-react";
import SourceCitation from "./SourceCitation";

export default function ChatMessage({ message, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-4 p-4 rounded-2xl transition-colors ${
        isAssistant
          ? "glass border border-surface-800/80 bg-surface-900/40"
          : "bg-surface-800/60 ml-auto max-w-2xl border border-surface-700/50"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
          isAssistant
            ? "bg-gradient-to-tr from-primary-600 to-accent-400 text-white shadow-md shadow-primary-500/20"
            : "bg-surface-700 text-surface-200"
        }`}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-400">
            {isAssistant ? "AI HR Assistant" : "You"}
          </span>

          {isAssistant && message.content && (
            <button
              onClick={copyToClipboard}
              className="text-surface-400 hover:text-surface-100 p-1 rounded-lg hover:bg-surface-800 transition-colors flex items-center gap-1 text-xs"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>

        {/* Message Text with Streaming Cursor */}
        <div
          className={`text-sm text-surface-200 leading-relaxed whitespace-pre-wrap ${
            isStreaming ? "typing-cursor" : ""
          }`}
        >
          {message.content}
        </div>

        {/* Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}
      </div>
    </div>
  );
}
