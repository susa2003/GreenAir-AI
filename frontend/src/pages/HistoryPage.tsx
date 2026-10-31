import React, { useState, useEffect } from "react";
import {
  Clock,
  Activity,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const records = await api.getHistory(50, filterType || undefined);
      setHistory(records);
    } catch (e) {
      console.warn("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            Audit Trail & Analysis History
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Chronological audit log of all model predictions, tool executions, and multi-pollutant analyses.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg bg-[#0a1510] border border-[#182e22] px-3 py-1.5 text-xs text-emerald-300 focus:outline-none"
          >
            <option value="">All Record Types</option>
            <option value="prediction">Predictions</option>
            <option value="analysis">Analyses</option>
          </select>
        </div>
      </div>

      {/* History Table / Cards */}
      <div className="rounded-xl bg-[#0c1813] border border-[#182e22] overflow-hidden">
        <div className="p-4 border-b border-[#162a1f] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Execution Logs ({history.length})</h3>
          <span className="text-[10px] font-mono text-gray-500">Persistent SQLite Ledger</span>
        </div>

        <div className="divide-y divide-[#14261d]">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-xs">Loading audit records...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No historical records found. Run a prediction or analysis to populate the audit trail.
            </div>
          ) : (
            history.map((rec) => {
              const isExpanded = expandedId === rec.id;
              const res = rec.result || {};
              const cat = res.category;
              return (
                <div key={rec.id} className="p-4 hover:bg-[#0e1c15] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-white">{rec.title}</h4>
                          {cat && <StatusBadge category={cat} size="sm" />}
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          ID: {rec.id} • {new Date(rec.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(rec.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      <span>{isExpanded ? "Hide Details" : "Inspect Payload"}</span>
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Quick parameter badges */}
                  {rec.input_summary && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-mono">
                      {Object.entries(rec.input_summary).map(([k, v]) => (
                        <span key={k} className="rounded bg-[#08120d] border border-[#16291e] px-2 py-0.5 text-gray-300">
                          {k}: <span className="text-emerald-400 font-bold">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 rounded-lg bg-[#060c09] border border-[#14261c] p-3 text-[10px] font-mono space-y-2">
                      <div className="text-gray-400 font-semibold uppercase">Structured Output Payload:</div>
                      <pre className="text-emerald-300 overflow-x-auto max-h-60 p-2 rounded bg-[#09130e]">
                        {JSON.stringify(rec.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
