import React from "react";
import {
  LayoutDashboard,
  Bot,
  Activity,
  Database,
  TrendingUp,
  FileText,
  Clock,
  Info,
  ShieldCheck,
  Leaf,
  Layers,
  ArrowLeftRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activePage, setActivePage, activeDataset, systemHealth } = useApp();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "AI Agent Chat", icon: Bot, badge: "AI" },
    { id: "compare", label: "City Comparison", icon: ArrowLeftRight, badge: "INDIA" },
    { id: "predict", label: "Prediction Lab", icon: Activity },
    { id: "datasets", label: "Dataset Explorer", icon: Database },
    { id: "trends", label: "Trends & Anomalies", icon: TrendingUp },
    { id: "reports", label: "Reports & Exports", icon: FileText },
    { id: "history", label: "Analysis History", icon: Clock },
    { id: "about", label: "System & Standards", icon: Info },
  ];

  const handleSelect = (id: string) => {
    setActivePage(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0a1410] border-r border-[#1a2d23] transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[#16271e]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-950/50">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                GreenAir <span className="text-emerald-400 text-xs font-mono uppercase bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">AI</span>
              </h1>
              <p className="text-[11px] text-gray-400">Environmental Intelligence</p>
            </div>
          </div>

          {/* Active Dataset Pill */}
          <div className="px-4 py-3 border-b border-[#14231b]">
            <button
              onClick={() => handleSelect("datasets")}
              className="w-full text-left rounded-lg bg-[#0e1b15] hover:bg-[#13251d] px-3 py-2 border border-[#1b3125] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Active Dataset</p>
                </div>
                {activeDataset && (
                  <span
                    className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                      activeDataset.is_synthetic || activeDataset.filename.toLowerCase().includes("synthetic")
                        ? "bg-amber-950 text-amber-400 border-amber-800/80"
                        : activeDataset.source_type === "cpcb_ground" || activeDataset.filename.toLowerCase().includes("cpcb")
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700/80"
                        : activeDataset.source_type === "open_meteo_model" || activeDataset.filename.toLowerCase().includes("openmeteo")
                        ? "bg-sky-950 text-sky-300 border-sky-700/80"
                        : "bg-blue-950 text-blue-300 border-blue-700/80"
                    }`}
                  >
                    {activeDataset.is_synthetic || activeDataset.filename.toLowerCase().includes("synthetic")
                      ? "Synthetic Demo"
                      : activeDataset.source_type === "cpcb_ground" || activeDataset.filename.toLowerCase().includes("cpcb")
                      ? "CPCB Ground"
                      : activeDataset.source_type === "open_meteo_model" || activeDataset.filename.toLowerCase().includes("openmeteo")
                      ? "Open-Meteo 72h"
                      : "User File"}
                  </span>
                )}
              </div>
              <p className="truncate text-xs font-medium text-emerald-300 mt-1 group-hover:text-emerald-200">
                {activeDataset ? activeDataset.filename : "No dataset loaded"}
              </p>
              {activeDataset && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {activeDataset.row_count} rows • Quality: {activeDataset.data_quality_score}/100
                </p>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 shadow-sm"
                      : "text-gray-400 hover:bg-[#111f18] hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Health / Footer status */}
        <div className="p-4 border-t border-[#16271e]">
          <div className="rounded-lg bg-[#0d1813] p-3 border border-[#182b20]">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Backend Engine
              </span>
              <span className="text-[10px] font-mono text-gray-400">v1.0.0</span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              Model: <span className="text-gray-300 font-mono">{systemHealth?.model.type || "RandomForest"}</span>
            </p>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">
              AI: <span className="text-gray-300">{systemHealth?.ai_engine.active_provider || "Deterministic"}</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
