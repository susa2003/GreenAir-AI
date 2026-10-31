import React from "react";
import { Menu, Sparkles, FileText, Activity, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { activePage, setActivePage, activeDataset, refreshHealth } = useApp();

  const titles: Record<string, string> = {
    dashboard: "Environmental Intelligence Overview",
    chat: "AI Agent Orchestration & Advisory",
    compare: "India Cities Comparative Air Quality Intelligence",
    predict: "Air Quality Machine Learning Prediction Lab",
    datasets: "Environmental Dataset Ingestion & Quality Audit",
    trends: "Historical Trend Trajectories & Outlier Detection",
    reports: "Automated Environmental Assessment Reports",
    history: "System Audit Trail & Analysis History",
    about: "System Architecture, Model Details & Standards",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#182c21] bg-[#08110d]/90 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-400 hover:bg-[#111f18] hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm md:text-base font-semibold text-white tracking-tight">
            {titles[activePage] || "GreenAir AI Agent"}
          </h2>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Autonomous Multi-Pollutant Decision Support Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivePage("chat")}
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/60 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-800/40 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Agent Chat</span>
        </button>

        <button
          onClick={() => setActivePage("predict")}
          className="flex items-center gap-1.5 rounded-lg bg-[#112119] border border-[#1e382b] px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#172c21] transition-colors"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Run</span> Prediction
        </button>

        <button
          onClick={() => setActivePage("reports")}
          className="flex items-center gap-1.5 rounded-lg bg-[#112119] border border-[#1e382b] px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#172c21] transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export</span> Report
        </button>
      </div>
    </header>
  );
};
