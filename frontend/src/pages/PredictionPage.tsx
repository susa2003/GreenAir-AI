import React, { useState } from "react";
import {
  Activity,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Info,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import { PollutantValues, PredictionResult, PollutantAnalysisResult } from "../types";

export const PredictionPage: React.FC = () => {
  const { pollutantInputs, setPollutantInputs, latestPrediction, setLatestPrediction, setActivePage } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PollutantAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pollutantConfigs = [
    { key: "PM2.5" as const, label: "PM2.5", unit: "µg/m³", min: 0, max: 250, step: 1.0, benchmark: 60, desc: "Fine particulate matter (combustion, smoke)" },
    { key: "PM10" as const, label: "PM10", unit: "µg/m³", min: 0, max: 400, step: 1.0, benchmark: 100, desc: "Inhalable dust and coarse particulates" },
    { key: "NO2" as const, label: "NO2", unit: "µg/m³", min: 0, max: 200, step: 1.0, benchmark: 80, desc: "Nitrogen dioxide (vehicular traffic)" },
    { key: "CO" as const, label: "CO", unit: "mg/m³", min: 0, max: 10, step: 0.1, benchmark: 2.0, desc: "Carbon monoxide (incomplete combustion)" },
    { key: "SO2" as const, label: "SO2", unit: "µg/m³", min: 0, max: 200, step: 1.0, benchmark: 80, desc: "Sulfur dioxide (industrial power generation)" },
    { key: "O3" as const, label: "O3", unit: "µg/m³", min: 0, max: 250, step: 1.0, benchmark: 100, desc: "Ground-level ozone (photochemical smog)" },
  ];

  const presets = [
    { label: "Satisfactory Baseline", values: { "PM2.5": 20.0, PM10: 35.0, NO2: 15.0, CO: 0.3, SO2: 6.0, O3: 22.0 } },
    { label: "Moderate Urban", values: { "PM2.5": 45.0, PM10: 75.0, NO2: 35.0, CO: 0.7, SO2: 14.0, O3: 40.0 } },
    { label: "Elevated Smog Event", values: { "PM2.5": 140.0, PM10: 220.0, NO2: 85.0, CO: 2.4, SO2: 65.0, O3: 95.0 } },
  ];

  const handleInputChange = (key: keyof PollutantValues, value: number) => {
    setPollutantInputs((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const pred = await api.predict(pollutantInputs);
      setLatestPrediction(pred);
      const analysis = await api.analyzePollutants(pollutantInputs);
      setAnalysisResult(analysis);
    } catch (err: any) {
      setErrorMsg(err.message || "Prediction inference failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Machine Learning Air Quality Prediction Lab
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Supervised Random Forest classification using 6 standard air quality parameters.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-medium">Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setPollutantInputs(preset.values)}
              className="text-xs rounded-lg bg-[#0e1d16] hover:bg-[#152c20] border border-[#1e392a] px-2.5 py-1 text-emerald-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Inputs Left, Prediction Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pollutant Inputs (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#162a1f] pb-3">
            <h3 className="text-sm font-semibold text-white">Input Measured Concentrations</h3>
            <button
              onClick={() =>
                setPollutantInputs({ "PM2.5": 30.0, PM10: 50.0, NO2: 20.0, CO: 0.5, SO2: 10.0, O3: 30.0 })
              }
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pollutantConfigs.map((cfg) => {
              const val = pollutantInputs[cfg.key];
              const ratio = val / cfg.benchmark;
              return (
                <div key={cfg.key} className="rounded-lg bg-[#09120e] border border-[#15281e] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{cfg.label}</span>
                      <span className="text-[10px] text-gray-500 ml-1">({cfg.unit})</span>
                    </div>
                    <input
                      type="number"
                      step={cfg.step}
                      min={cfg.min}
                      max={cfg.max}
                      value={val}
                      onChange={(e) => handleInputChange(cfg.key, parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-md bg-[#0e1d16] border border-[#1e392a] px-2 py-1 text-right text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={val}
                    onChange={(e) => handleInputChange(cfg.key, parseFloat(e.target.value) || 0)}
                    className="w-full h-1.5 bg-[#172920] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Benchmark: {cfg.benchmark} {cfg.unit}</span>
                    <span
                      className={`font-mono font-medium ${
                        ratio >= 1.5 ? "text-red-400" : ratio >= 1.0 ? "text-orange-400" : "text-emerald-400"
                      }`}
                    >
                      {ratio.toFixed(2)}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950 transition-all mt-4"
          >
            <Activity className="h-4 w-4" />
            <span>{loading ? "Running ML Inference..." : "Predict Air Quality Category"}</span>
          </button>
        </div>

        {/* Right Column: Prediction Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {latestPrediction ? (
            <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#162a1f] pb-3">
                <h3 className="text-sm font-semibold text-white">Prediction Results</h3>
                <span className="text-[10px] font-mono text-gray-400">
                  {latestPrediction.model_name}
                </span>
              </div>

              {/* Category Card */}
              <div
                className="rounded-xl p-4 text-center border"
                style={{
                  backgroundColor: `${latestPrediction.status_color}15`,
                  borderColor: `${latestPrediction.status_color}50`,
                }}
              >
                <p className="text-xs uppercase tracking-wider text-gray-300 font-medium">Classified Air Quality</p>
                <h2
                  className="text-3xl font-extrabold tracking-tight mt-1"
                  style={{ color: latestPrediction.status_color }}
                >
                  {latestPrediction.category}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08120d] border border-[#193123] text-xs">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="font-mono font-bold text-white">
                    {latestPrediction.confidence_pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Class Probability Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300">Category Probabilities</h4>
                {Object.entries(latestPrediction.probabilities).map(([cat, prob]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">{cat}</span>
                      <span className="font-mono text-emerald-400">{prob.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#14261c] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat === latestPrediction.category ? "bg-emerald-500" : "bg-gray-600"
                        }`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Health Guidance */}
              <div className="p-3.5 rounded-lg bg-[#09120e] border border-[#172c20] space-y-1.5">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Actionable Environmental Advisory
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {latestPrediction.health_guidance}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActivePage("chat")}
                  className="flex-1 rounded-lg bg-[#12231a] hover:bg-[#1a3528] border border-[#203f2e] py-2 text-xs font-medium text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask AI About This
                </button>
                <button
                  onClick={() => setActivePage("reports")}
                  className="flex-1 rounded-lg bg-[#12231a] hover:bg-[#1a3528] border border-[#203f2e] py-2 text-xs font-medium text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Generate Report
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-8 text-center text-gray-500">
              <Activity className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <p className="text-xs">Adjust pollutant values and click "Predict Air Quality Category".</p>
            </div>
          )}

          {/* Legal / Regulatory notice */}
          <div className="p-3 rounded-lg bg-[#08120d] border border-[#14261c] flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Regulatory Notice: Predicted categories are machine-learning classifications based on feature patterns in training data. They do not constitute official statutory AQI calculations or medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
