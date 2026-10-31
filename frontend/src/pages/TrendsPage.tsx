import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Sliders,
  Calendar,
  Activity,
  Layers,
  Info,
  CheckCircle2,
  Database,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../api";
import { TrendResult, AnomalyResult } from "../types";

export const TrendsPage: React.FC = () => {
  const {
    activeDataset,
    loadSyntheticDemo,
    selectedCity,
    importOpenMeteoForCity,
    isLoading: appLoading,
  } = useApp();

  const [selectedPollutant, setSelectedPollutant] = useState<string>("PM2.5");
  const [trendData, setTrendData] = useState<TrendResult | null>(null);
  const [trendError, setTrendError] = useState<string>("");
  const [anomalyData, setAnomalyData] = useState<AnomalyResult | null>(null);
  const [anomalyMethod, setAnomalyMethod] = useState<string>("iqr");
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(1.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pollutants = ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3"];

  const fetchData = async () => {
    if (!activeDataset) return;
    setLoading(true);
    setErrorMsg("");
    setTrendError("");

    try {
      // Trends
      if (activeDataset.has_timestamps && activeDataset.is_time_series !== false) {
        try {
          const t = await api.getTrends(activeDataset.id, selectedPollutant, 3);
          setTrendData(t);
        } catch (e: any) {
          setTrendData(null);
          setTrendError(e.message || "Failed to compute trends.");
        }
      } else {
        setTrendData(null);
        if (activeDataset.is_time_series === false) {
          setTrendError("Spatial snapshot dataset: all observations are recorded at a single timestamp snapshot.");
        } else {
          setTrendError("No valid timestamp column identified in the active dataset.");
        }
      }

      // Anomalies
      try {
        const a = await api.getAnomalies(
          activeDataset.id,
          selectedPollutant,
          anomalyMethod,
          anomalyThreshold
        );
        setAnomalyData(a);
      } catch (e: any) {
        console.warn("Anomaly fetch error:", e);
        setAnomalyData(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze time series and anomalies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDataset) {
      fetchData();
    }
  }, [activeDataset, selectedPollutant, anomalyMethod, anomalyThreshold]);

  if (!activeDataset) {
    return (
      <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <TrendingUp className="h-12 w-12 mx-auto text-emerald-400" />
        <h3 className="text-base font-bold text-white">No Active Dataset Loaded</h3>
        <p className="text-xs text-gray-400">
          Historical trend analysis and outlier detection require an ingested dataset with observation records.
        </p>
        <button
          onClick={loadSyntheticDemo}
          disabled={appLoading}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-colors"
        >
          {appLoading ? "Loading..." : "Load Demo Air Quality Dataset"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Trends & Statistical Anomaly Analysis
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Chronological linear slope modeling, moving averages, and distribution outlier scans.
          </p>
        </div>

        {/* Pollutant Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#0a1510] border border-[#16271e] p-1 rounded-xl">
          {pollutants.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPollutant(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedPollutant === p
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Time-Series Trend */}
      <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162a1f] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Time-Series Trajectory: {selectedPollutant}</span>
              {trendData && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    trendData.trend_direction === "Increasing"
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : trendData.trend_direction === "Decreasing"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-[#14261d] text-gray-300 border border-[#203a2c]"
                  }`}
                >
                  {trendData.trend_direction} ({trendData.change_percentage > 0 ? "+" : ""}
                  {trendData.change_percentage}%)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {trendData?.coverage_note || "Visualizing chronological readings and 3-period moving average."}
            </p>
          </div>

          {/* Quick Metrics */}
          {trendData && (
            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div>
                <span className="text-[10px] text-gray-500 block">Linear Slope</span>
                <span className="text-emerald-300 font-bold">{trendData.slope}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Baseline vs Latest</span>
                <span className="text-white">
                  {trendData.initial_value} &rarr; {trendData.final_value}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Mean</span>
                <span className="text-gray-300">{trendData.mean_value}</span>
              </div>
            </div>
          )}
        </div>

        {trendData && trendData.data_points.length > 0 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => (val.includes(" ") ? val.split(" ")[0] : val)}
                />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a1510",
                    borderColor: "#1d3628",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#e5e7eb",
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" name="Measured Concentration" />
                <Line type="monotone" dataKey="rolling_avg" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Moving Avg" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 bg-[#09120e] border border-[#1b3225] rounded-xl space-y-3">
            <Calendar className="h-8 w-8 mx-auto text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              {activeDataset.is_time_series === false || trendError.includes("snapshot")
                ? "Spatial Snapshot Dataset (Single Observation Timestamp)"
                : "Time-Series Trend Unavailable"}
            </h4>
            <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
              {activeDataset.is_time_series === false || trendError.includes("snapshot")
                ? `The active dataset ('${activeDataset.filename}') contains spatial cross-section measurements recorded at a single observation time snapshot across monitoring stations. Linear time-series slope modeling and moving averages require observations across multiple distinct timestamps.`
                : trendError || "Trend analysis requires chronological observations across multiple distinct timestamps."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={async () => {
                  await importOpenMeteoForCity(selectedCity);
                }}
                disabled={appLoading}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all"
              >
                <Clock className="h-4 w-4" />
                <span>Import 72h Open-Meteo Series for {selectedCity}</span>
              </button>
              <button
                onClick={loadSyntheticDemo}
                disabled={appLoading}
                className="flex items-center gap-2 rounded-xl bg-[#14261d] hover:bg-[#1b3628] border border-[#234533] px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all shadow-md"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Load Demo Time Series</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Statistical Anomaly Detection */}
      <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#162a1f] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Statistical Outlier & Anomaly Detection
            </h3>
            <p className="text-[11px] text-gray-400">
              Identifies values deviating significantly from the empirical sample distribution.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Method:</span>
              <select
                value={anomalyMethod}
                onChange={(e) => setAnomalyMethod(e.target.value)}
                className="rounded-lg bg-[#08120d] border border-[#1a3525] px-2 py-1 text-xs text-emerald-300 focus:outline-none"
              >
                <option value="iqr">IQR (1.5x Interquartile)</option>
                <option value="zscore">Robust Z-Score (Std Dev)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Threshold:</span>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="5.0"
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value) || 1.5)}
                className="w-14 rounded-lg bg-[#08120d] border border-[#1a3525] px-2 py-1 text-xs text-emerald-300 text-right focus:outline-none"
              />
            </div>
          </div>
        </div>

        {anomalyData ? (
          <div className="space-y-4">
            {/* Anomaly KPI banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#08120d] border border-[#172c20]">
                <p className="text-[10px] text-gray-500 uppercase">Records Evaluated</p>
                <p className="text-base font-bold text-white mt-0.5">{anomalyData.total_records_examined}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#08120d] border border-[#172c20]">
                <p className="text-[10px] text-gray-500 uppercase">Anomalies Flagged</p>
                <p className="text-base font-bold text-amber-400 mt-0.5">{anomalyData.anomaly_count}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#08120d] border border-[#172c20]">
                <p className="text-[10px] text-gray-500 uppercase">Anomaly Rate</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{anomalyData.anomaly_percentage}%</p>
              </div>
              <div className="p-3 rounded-lg bg-[#08120d] border border-[#172c20]">
                <p className="text-[10px] text-gray-500 uppercase">Valid Bounds</p>
                <p className="text-xs font-mono font-medium text-gray-300 mt-1">
                  [{anomalyData.lower_bound}, {anomalyData.upper_bound}]
                </p>
              </div>
            </div>

            {/* Anomaly Table */}
            {anomalyData.anomalies.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#172b1f]">
                <table className="w-full text-left text-[11px] text-gray-300">
                  <thead className="bg-[#08120d] text-gray-400 text-[10px] uppercase font-mono border-b border-[#172b1f]">
                    <tr>
                      <th className="px-3 py-2">Row #</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Measured Value</th>
                      <th className="px-3 py-2">Deviation Score</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#13241a]">
                    {anomalyData.anomalies.map((a, idx) => (
                      <tr key={idx} className="hover:bg-[#0e1a14]">
                        <td className="px-3 py-2 font-mono text-gray-400">#{a.row_index}</td>
                        <td className="px-3 py-2 font-mono text-gray-300">{a.timestamp || "N/A"}</td>
                        <td className="px-3 py-2 font-mono font-bold text-amber-300">{a.value}</td>
                        <td className="px-3 py-2 font-mono">{a.score}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                              a.severity === "High"
                                ? "bg-red-950 text-red-400 border border-red-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {a.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400 text-[10px]">{a.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 bg-[#08120d] rounded-lg">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs">No statistical outliers detected under threshold {anomalyThreshold}.</p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#08120d] border border-[#16271e] flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {anomalyData.interpretation_note}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Loading anomaly scan...</div>
        )}
      </div>
    </div>
  );
};
