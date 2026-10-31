import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api";
import { ChatMessage, ChatSession, ToolExecutionRecord } from "../types";

export const ChatPage: React.FC = () => {
  const { activeDataset, pollutantInputs } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Predict air-quality category for PM2.5: 45.0, PM10: 75.0, NO2: 32.0, CO: 0.8, SO2: 15.0, O3: 38.0",
    "Which pollutant has the highest measured concentration relative to health thresholds?",
    "Analyze the uploaded dataset and report its data quality score.",
    "Show changes in PM2.5 over time and evaluate the trend direction.",
    "Find unusual readings or statistical outliers in the active dataset.",
    "Generate an executive environmental assessment report in PDF format.",
  ];

  const loadSessions = async () => {
    try {
      const list = await api.getSessions();
      setSessions(list);
    } catch (e) {
      console.warn("Failed to load sessions:", e);
    }
  };

  const selectSession = async (sid: string) => {
    setSessionId(sid);
    try {
      const data = await api.getSessionMessages(sid);
      const formatted: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tool_calls: m.tool_calls || [],
        created_at: m.created_at,
      }));
      setMessages(formatted);
    } catch (e) {
      console.warn("Failed to load messages for session:", e);
    }
  };

  const startNewSession = () => {
    setSessionId("");
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I am the **GreenAir AI Agent**, an autonomous environmental intelligence specialist. I can execute real machine-learning models, benchmark multi-pollutant ratios, detect dataset anomalies, evaluate time-series trends, and generate downloadable reports.\n\nHow can I assist your environmental analysis today?",
      },
    ]);
  };

  useEffect(() => {
    loadSessions();
    startNewSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const resp = await api.sendMessage({
        message: text,
        session_id: sessionId || undefined,
        active_dataset_id: activeDataset?.id || undefined,
        latest_pollutants: pollutantInputs,
      });

      if (!sessionId && resp.session_id) {
        setSessionId(resp.session_id);
        loadSessions();
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: resp.response,
        tool_calls: resp.tools_executed || [],
        created_at: resp.created_at,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error executing request: ${err.message || "Failed to contact agent service."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleToolExpand = (key: string) => {
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Sessions Sidebar on desktop */}
      <div className="hidden lg:flex w-64 flex-col rounded-xl bg-[#0a1510] border border-[#16291e] p-3 shrink-0">
        <button
          onClick={startNewSession}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white shadow-md transition-colors mb-3"
        >
          <Plus className="h-4 w-4" />
          <span>New Session</span>
        </button>

        <div className="text-[10px] uppercase font-mono font-semibold text-gray-400 px-2 py-1 tracking-wider">
          Recent Consultations
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-3 italic">No prior sessions</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => selectSession(s.session_id)}
                className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors truncate block ${
                  sessionId === s.session_id
                    ? "bg-[#14291f] text-emerald-300 border border-[#214332]"
                    : "text-gray-400 hover:bg-[#0f1d16] hover:text-gray-200"
                }`}
              >
                <div className="font-medium truncate">{s.title || "Consultation"}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                  <span>• {s.message_count} msgs</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col rounded-xl bg-[#0a1510] border border-[#16291e] overflow-hidden">
        {/* Chat Header Status */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#14271d] bg-[#0c1913]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">GreenAir Autonomous Agent</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-gray-400">
                Ground-truth tool calling: Random Forest ML, Benchmark Ratios, IQR Outliers, Reports
              </p>
            </div>
          </div>

          {activeDataset && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#11231a] border border-[#1e3d2c] px-2.5 py-1 text-[11px] text-emerald-300">
              <Database className="h-3 w-3 text-emerald-400" />
              <span className="truncate max-w-[150px]">{activeDataset.filename}</span>
            </div>
          )}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-[#0e1d16] border border-[#193325] text-gray-200"
                }`}
              >
                {/* Render Executed Tool Badges for assistant */}
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-[10px] uppercase font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Executed Agent Tools ({msg.tool_calls.length})
                    </p>
                    {msg.tool_calls.map((tool, tIdx) => {
                      const expandKey = `${i}-${tIdx}`;
                      const isExpanded = !!expandedTools[expandKey];
                      return (
                        <div
                          key={tIdx}
                          className="rounded-lg bg-[#08120d] border border-[#172c20] overflow-hidden text-[11px]"
                        >
                          <button
                            onClick={() => toggleToolExpand(expandKey)}
                            className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-[#0c1a13] text-left transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {tool.success ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-red-400" />
                              )}
                              <span className="font-mono font-medium text-emerald-300">
                                {tool.tool_name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                ({tool.execution_time_ms}ms)
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-2.5 border-t border-[#14261c] bg-[#050a08] space-y-1.5 font-mono text-[10px]">
                              <div>
                                <span className="text-gray-400">Arguments: </span>
                                <span className="text-emerald-400">
                                  {JSON.stringify(tool.tool_arguments)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Output: </span>
                                <pre className="text-gray-300 overflow-x-auto p-1.5 rounded bg-[#09130e] max-h-40">
                                  {JSON.stringify(tool.output, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Render Content */}
                <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14281f] border border-[#214332] text-gray-300 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl bg-[#0e1d16] border border-[#193325] px-4 py-2.5 text-xs text-gray-400 flex items-center gap-2">
                <span>GreenAir Agent reasoning & selecting tools</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts pills */}
        <div className="px-4 py-2 border-t border-[#14271d] bg-[#0c1813]/60 flex gap-2 overflow-x-auto">
          {suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap rounded-full bg-[#11231a] hover:bg-[#183125] border border-[#1c3829] px-3 py-1 text-gray-300 transition-colors shrink-0"
            >
              {prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-[#14271d] bg-[#0c1913]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask GreenAir: predict category, evaluate trends, find anomalies, or generate reports..."
              className="flex-1 rounded-xl bg-[#08120d] border border-[#182f23] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-950"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
