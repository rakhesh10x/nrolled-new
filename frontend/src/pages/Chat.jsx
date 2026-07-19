import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  MessageSquare,
  Search,
  MoreVertical,
  Paperclip,
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../api/client";
import { streamChatMessage } from "../api/stream";
import TypingIndicator from "../components/chat/TypingIndicator";
import PageTransition from "../components/common/PageTransition";
import { useToast } from "../context/ToastContext";

export default function Chat() {
  const { toast } = useToast();
  const location = useLocation();

  const [sessions, setSessions] = useState([]);
  const [currentSessionUuid, setCurrentSessionUuid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputContent, setInputContent] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [openSources, setOpenSources] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef(null);
  const streamControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Auto resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputContent]);

  // Fetch chat sessions list
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await api.get("/chat/sessions");
        const list = res.data || [];
        setSessions(list);
      } catch (e) {
        // ignore error
      }
    }
    fetchSessions();
  }, []);

  // Handle location initial question if passed from dashboard
  useEffect(() => {
    if (location.state?.initialQuestion) {
      handleSendMessage(location.state.initialQuestion);
    }
  }, [location.state]);

  // Select session and fetch messages
  const handleSelectSession = async (uuid) => {
    setCurrentSessionUuid(uuid);
    try {
      const res = await api.get(`/chat/sessions/${uuid}/messages`);
      setMessages(res.data || []);
    } catch (e) {
      toast.error("Failed to load conversation history.");
    }
  };

  // Start new chat session
  const handleNewChat = () => {
    setCurrentSessionUuid(null);
    setMessages([]);
  };

  // Send message and stream response
  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputContent;
    if (!text.trim() || isStreaming) return;

    // Append user message immediately
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputContent("");

    // Prepare assistant placeholder message
    const assistantId = Date.now() + 1;
    const assistantMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    const payload = {
      session_uuid: currentSessionUuid,
      content: text.trim(),
    };

    const controller = streamChatMessage(
      payload,
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      (finalData) => {
        setIsStreaming(false);
        if (finalData.session_uuid) {
          setCurrentSessionUuid(finalData.session_uuid);
          api.get("/chat/sessions").then((res) => setSessions(res.data || [])).catch(() => {});
        }
        if (finalData.sources) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, sources: finalData.sources } : msg
            )
          );
        }
      },
      (err) => {
        setIsStreaming(false);
        toast.error(err.message || "Failed to communicate with AI Assistant.");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    "I am sorry, but the AI service is currently unavailable. Please check your network or try again later.",
                }
              : msg
          )
        );
      }
    );

    streamControllerRef.current = controller;
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSourceOpen = (idx) => {
    setOpenSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="h-[calc(100vh-7rem)] flex gap-6 overflow-hidden select-none">
        {/* Panel 2: Conversations List (360px width) */}
        <div className="hidden xl:flex flex-col w-[360px] bg-white dark:bg-[#0B1120] rounded-2xl p-4 shrink-0 border border-slate-200 dark:border-slate-800/80 shadow-lg shadow-slate-200/40 dark:shadow-none transition-colors duration-300">
          {/* New Conversation Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl btn-gradient text-white font-extrabold text-sm mb-4 shadow-lg shadow-purple-600/30"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <Sparkles className="w-4 h-4 text-purple-200" />
          </button>

          {/* Search & Header */}
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversations
            </span>
            <Search className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors" />
          </div>

          {/* Conversations Card List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 p-4 text-center">
                No past conversations found.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = currentSessionUuid === s.uuid;
                return (
                  <div
                    key={s.uuid}
                    onClick={() => handleSelectSession(s.uuid)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500/50 text-purple-950 dark:text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                          {s.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        {s.updated_at ? new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-9">
                      <span>{s.message_count || 5} messages</span>
                      <MoreVertical className="w-3 h-3 hover:text-slate-800 dark:hover:text-slate-200" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-center mt-auto">
            <button className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold transition-colors">
              View all conversations &gt;
            </button>
          </div>
        </div>

        {/* Panel 3: Main Chat Window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-none transition-colors duration-300">
          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-purple-600/30">
                  <Bot className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                  AI HR Assistant
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Ask me anything about company HR policies, leave balances, casual leave, sick leave, payroll, or working hours.
                </p>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Show pending leave requests",
                    "Casual leave policy details",
                    "How to apply for WFH?",
                    "Maternity leave benefits",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-xs px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-700 transition-all font-semibold text-left shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id || idx} className="space-y-3">
                    {isUser ? (
                      /* User Message Bubble */
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {msg.created_at || "Just now"}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">You</span>
                          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="max-w-xl p-4 rounded-2xl btn-gradient text-white text-xs font-semibold leading-relaxed shadow-lg shadow-purple-600/20">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      /* Assistant Card */
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                        {/* Header & Actions */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/30">
                              HR
                            </div>
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                              AI HR Assistant
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                            <button
                              onClick={() => handleCopy(msg.content, idx)}
                              className="p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              title="Copy response"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleSendMessage(messages[idx - 1]?.content || "Regenerate")}
                              className="p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              title="Regenerate"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content Body */}
                        <div
                          className={`text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap ${
                            isStreaming && idx === messages.length - 1 ? "typing-cursor" : ""
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Source Citations Accordion */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="pt-2">
                            <button
                              onClick={() => toggleSourceOpen(idx)}
                              className="flex items-center gap-2 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline transition-colors p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Referenced Sources ({msg.sources.length})</span>
                              {openSources[idx] ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {openSources[idx] && (
                              <div className="mt-2 space-y-1.5 pl-2">
                                {msg.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                    <span>{src}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <TypingIndicator />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Area */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-2.5 flex items-center gap-3 shadow-inner"
            >
              <textarea
                ref={textareaRef}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask HR Assistant anything..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent px-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-32"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors"
                  title="Prompt suggestions"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!inputContent.trim() || isStreaming}
                  className="p-3 rounded-xl btn-gradient text-white disabled:opacity-40 transition-all shadow-md shadow-purple-600/30"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="flex items-center justify-between px-2 mt-2 text-[10px] text-slate-500">
              <span>🛡️ AI responses may contain inaccuracies. Please verify important policy details.</span>
              <span>Press Enter to send, Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
