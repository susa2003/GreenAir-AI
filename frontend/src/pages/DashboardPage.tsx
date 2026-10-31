import React, { useState, useEffect } from "react";
import {
  Activity,
  Wind,
  ShieldAlert,
  Database,
  ArrowRight,
  TrendingUp,
  FileText,
  Sparkles,
  AlertTriangle,
  Info,
  ArrowLeftRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useApp } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { IndiaLiveAirCard } from "../components/IndiaLiveAirCard";
import { api } from "../api";
import { PollutantAnalysisResult } from "../types";

export const DashboardPage: React.FC = () => {
  const {
    setActivePage,
    activeDataset,
    latestPrediction,
    pollutantInputs,
    pollutantSource,
    applyCityToInputs,
    selectedCity,
    loadSyntheticDemo,
    isLoading,
  } = useApp();

  const [analysis, setAnalysis] = useState<PollutantAnalysisResult | null>(null);

  useEffect(() => {
    api.analyzePollutants(pollutantInputs)
      .then((res) => setAnalysis(res))
      .catch((e) => console.warn("Analysis failed:", e));
  }, [pollutantInputs]);

  // Chart data: normalized ratios against 1.0 threshold
  const chartData = analysis
    ? analysis.metrics.map((m) => ({
        name: m.pollutant,
        ratio: m.benchmark_ratio,
        value: m.value,
        unit: m.unit,
        status: m.status,
      }))
    : [];

  const probabilityData = latestPrediction?.probabilities
    ? Object.entries(latestPrediction.probabilities).map(([cat, prob]) => ({
        category: cat,
        probability: prob,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c2219] via-[#102d20] to-[#0a1b14] border border-[#1b3e2d] p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Autonomous Decision Support Engine
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              GreenAir Environmental Intelligence Platform
            </h1>
            <p className="text-xs md:text-sm text-gray-300">
              Ground-truth ML classification, multi-pollutant threshold benchmarking, time-series anomaly detection, and automated report synthesis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActivePage("chat")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950 hover:from-emerald-500 hover:to-emerald-600 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch AI Agent</span>
            </button>
            <button
              onClick={() => setActivePage("compare")}
              className="flex items-center gap-2 rounded-xl bg-[#14291f] border border-[#234533] px-3.5 py-2.5 text-xs font-medium text-emerald-300 hover:bg-[#1a3528] transition-all"
            >
              <ArrowLeftRight className="h-4 w-4 text-emerald-400" />
              <span>Compare Cities</span>
            </button>
            {!activeDataset && (
              <button
                onClick={loadSyntheticDemo}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#14291f] border border-[#234533] px-3.5 py-2.5 text-xs font-medium text-emerald-300 hover:bg-[#1a3528] transition-all"
              >
                <Database className="h-4 w-4 text-emerald-400" />
                <span>{isLoading ? "Ingesting..." : "Load Demo Dataset"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* India Real-Time Atmospheric & Industrial Intelligence Card */}
      <IndiaLiveAirCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Air Quality Category */}
        <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Classified Category</span>
            <Wind className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {latestPrediction?.category || "Satisfactory"}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <StatusBadge category={latestPrediction?.category || "Satisfactory"} size="sm" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 truncate">
            Model: {latestPrediction?.model_name || "RandomForest"}
          </p>
        </div>

        {/* Card 2: Model Confidence */}
        <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Model Confidence</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {latestPrediction ? `${latestPrediction.confidence_pct.toFixed(1)}%` : "N/A"}
            </div>
            <div className="mt-2 w-full bg-[#16271e] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${latestPrediction?.confidence_pct || 0}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Predicted class probability</p>
        </div>

        {/* Card 3: Dominant Pollutant */}
        <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Dominant Driver</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {analysis?.dominant_pollutant || "PM2.5"}
            </div>
            <p className="text-xs text-amber-400 font-medium mt-1">
              {analysis?.highest_benchmark_ratio || 0.5}x ambient threshold
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 truncate" title={pollutantSource.label}>
            Source: <span className="text-emerald-400 font-medium">{pollutantSource.label}</span>
          </p>
        </div>

        {/* Card 4: Dataset Records */}
        <div
          onClick={() => setActivePage("datasets")}
          className="rounded-xl bg-[#0d1813] border border-[#182c21] p-4 flex flex-col justify-between cursor-pointer hover:border-emerald-600/70 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Active Dataset</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight flex items-center justify-between">
              <span>{activeDataset ? `${activeDataset.row_count} rows` : "No Dataset"}</span>
              {activeDataset && (
                <span
                  className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                    activeDataset.is_synthetic || activeDataset.filename.toLowerCase().includes("synthetic")
                      ? "bg-amber-950 text-amber-400 border-amber-800"
                      : activeDataset.source_type === "cpcb_ground" || activeDataset.filename.toLowerCase().includes("cpcb")
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : activeDataset.source_type === "open_meteo_model" || activeDataset.filename.toLowerCase().includes("openmeteo")
                      ? "bg-sky-950 text-sky-300 border-sky-700"
                      : "bg-blue-950 text-blue-300 border-blue-700"
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
            <p className="text-xs text-emerald-400 font-medium mt-1">
              Quality Score: {activeDataset ? `${activeDataset.data_quality_score}/100` : "--"}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 truncate group-hover:text-emerald-300">
            {activeDataset ? activeDataset.filename : "Load or upload a file"}
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pollutant Benchmark Comparison */}
        <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Multi-Pollutant Benchmark Ratios</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {pollutantSource.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Dimensionless ratio: &gt;1.0 exceeds standard environmental exposure benchmark
              </p>
            </div>
            <button
              onClick={applyCityToInputs}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-[#0d2218] border border-[#1d402e] px-2.5 py-1 rounded-lg transition-colors self-start sm:self-auto"
            >
              Sync {selectedCity}
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a1510",
                    borderColor: "#1d3628",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#e5e7eb",
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}x benchmark (${item.payload.value} ${item.payload.unit})`,
                    "Ratio",
                  ]}
                />
                <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.ratio >= 1.5
                          ? "#ef4444"
                          : entry.ratio >= 1.0
                          ? "#f97316"
                          : entry.ratio >= 0.7
                          ? "#f59e0b"
                          : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Baseline (&lt;0.7)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate (0.7-1.0)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Elevated (&gt;1.0)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Hazardous (&gt;1.5)
            </span>
          </div>
        </div>

        {/* Model Class Probabilities */}
        <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Model Probability Distribution</h3>
                <p className="text-[11px] text-gray-400">
                  Predicted likelihood across all 5 trained air quality categories
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#13251c] text-emerald-400 border border-[#1b3929]">
                5 Classes
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {probabilityData.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-300">{item.category}</span>
                    <span className="font-mono text-emerald-400">{item.probability.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#16271e] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.category === latestPrediction?.category
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : "bg-gray-600"
                      }`}
                      style={{ width: `${item.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-[#0a1510] border border-[#172a1f] flex items-start gap-2.5">
            <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {latestPrediction?.disclaimer ||
                "Classification reflects trained Scikit-learn Random Forest model patterns and is distinct from regulatory multi-pollutant AQI calculations."}
            </p>
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActivePage("predict")}
          className="group cursor-pointer rounded-xl bg-[#0d1813] border border-[#182c21] p-4 hover:border-emerald-700/60 transition-all hover:shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Interactive Prediction Lab</h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Adjust individual pollutant concentrations (PM2.5, PM10, NO2, CO, SO2, O3) and evaluate classification confidence.
          </p>
        </div>

        <div
          onClick={() => setActivePage("trends")}
          className="group cursor-pointer rounded-xl bg-[#0d1813] border border-[#182c21] p-4 hover:border-emerald-700/60 transition-all hover:shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Trend & Anomaly Analysis</h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Compute linear slopes, percentage change over time, and scan for statistical IQR/Z-score outliers.
          </p>
        </div>

        <div
          onClick={() => setActivePage("reports")}
          className="group cursor-pointer rounded-xl bg-[#0d1813] border border-[#182c21] p-4 hover:border-emerald-700/60 transition-all hover:shadow-lg hover:shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-white mt-3">Executive PDF Reports</h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Instantly synthesize branded environmental health reports with audit findings, charts, and recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};
