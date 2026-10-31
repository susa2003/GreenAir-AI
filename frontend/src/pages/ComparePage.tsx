import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  MapPin,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { useApp } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../api";
import { CityComparisonResponse } from "../types";

const POPULAR_COMPARISONS = [
  ["Delhi", "Mumbai"],
  ["Chennai", "Coimbatore"],
  ["Bengaluru", "Hyderabad"],
  ["Hosur", "Chennai"],
  ["Kolkata", "Delhi"],
];

export const ComparePage: React.FC = () => {
  const { setActivePage } = useApp();

  const [city1, setCity1] = useState("Delhi");
  const [city2, setCity2] = useState("Mumbai");
  const [comparison, setComparison] = useState<CityComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async (c1: string, c2: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.compareCities(c1, c2);
      setComparison(res);
    } catch (err: any) {
      setError(err?.message || "Failed to compare locations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runComparison(city1, city2);
  }, []);

  const handleSwap = () => {
    const next1 = city2;
    const next2 = city1;
    setCity1(next1);
    setCity2(next2);
    runComparison(next1, next2);
  };

  // Prepare chart data for Recharts
  const chartData = comparison
    ? Object.entries(comparison.comparison_metrics).map(([param, data]) => ({
        pollutant: param,
        [comparison.city_1]: data[comparison.city_1],
        [comparison.city_2]: data[comparison.city_2],
        unit: data.unit,
        pct_change: data.pct_change,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c2219] via-[#102d20] to-[#0a1b14] border border-[#1b3e2d] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-medium">
              <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-400" />
              Multi-Source Location Intelligence
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Side-by-Side Air Quality Comparison
            </h1>
            <p className="text-xs md:text-sm text-gray-300">
              Compare atmospheric concentrations, dominant pollutant drivers, and ML classifications across Indian cities in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage("chat")}
              className="rounded-xl bg-[#142a20] border border-[#214332] px-3.5 py-2 text-xs font-medium text-emerald-300 hover:bg-[#1a382b] transition-all"
            >
              Ask AI Agent to Compare
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Selector Controls */}
      <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Location 1
            </label>
            <input
              type="text"
              value={city1}
              onChange={(e) => setCity1(e.target.value)}
              placeholder="e.g. Delhi"
              className="w-full rounded-xl bg-[#08120d] border border-[#1f3b2c] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleSwap}
            title="Swap cities"
            className="rounded-xl bg-[#13271e] border border-[#1e3d2c] p-2.5 text-emerald-400 hover:bg-[#193327] transition-colors mt-5 sm:mt-5"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Location 2
            </label>
            <input
              type="text"
              value={city2}
              onChange={(e) => setCity2(e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full rounded-xl bg-[#08120d] border border-[#1f3b2c] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => runComparison(city1, city2)}
            disabled={isLoading || !city1.trim() || !city2.trim()}
            className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-md mt-5 sm:mt-5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>Compare Now</span>
          </button>
        </div>

        {/* Popular Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] text-gray-400 shrink-0 mr-1">Popular Comparisons:</span>
          {POPULAR_COMPARISONS.map(([c1, c2], idx) => (
            <button
              key={idx}
              onClick={() => {
                setCity1(c1);
                setCity2(c2);
                runComparison(c1, c2);
              }}
              className="rounded-lg bg-[#091510] border border-[#182e21] px-2.5 py-1 text-xs text-gray-300 hover:bg-[#12281d] hover:text-white transition-colors shrink-0"
            >
              {c1} vs {c2}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-800 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Side-by-Side Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City 1 Card */}
            <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{comparison.city_1}</h3>
                  <p className="text-[11px] text-gray-400">
                    {comparison.location_1.state || "India"} • {comparison.location_1.latitude}°N, {comparison.location_1.longitude}°E
                  </p>
                </div>
                <StatusBadge category={comparison.ml_class_1 || "Moderate"} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#15281e]">
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">PM2.5</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_1?.pm2_5 ?? "--"} µg/m³</p>
                </div>
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">PM10</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_1?.pm10 ?? "--"} µg/m³</p>
                </div>
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">CO</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_1?.carbon_monoxide_mgm3 ?? "--"} mg/m³</p>
                </div>
              </div>
            </div>

            {/* City 2 Card */}
            <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{comparison.city_2}</h3>
                  <p className="text-[11px] text-gray-400">
                    {comparison.location_2.state || "India"} • {comparison.location_2.latitude}°N, {comparison.location_2.longitude}°E
                  </p>
                </div>
                <StatusBadge category={comparison.ml_class_2 || "Moderate"} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#15281e]">
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">PM2.5</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_2?.pm2_5 ?? "--"} µg/m³</p>
                </div>
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">PM10</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_2?.pm10 ?? "--"} µg/m³</p>
                </div>
                <div className="rounded bg-[#08120d] p-2">
                  <span className="text-[10px] text-gray-400">CO</span>
                  <p className="text-sm font-bold text-white">{comparison.reading_2?.carbon_monoxide_mgm3 ?? "--"} mg/m³</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart of Pollutants */}
          <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Comparative Atmospheric Concentrations</h3>
                <p className="text-[11px] text-gray-400">Direct parameter side-by-side comparison</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Open-Meteo Model Data
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="pollutant" stroke="#4b5563" fontSize={11} />
                  <YAxis stroke="#4b5563" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1712", borderColor: "#1b3326", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey={comparison.city_1} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={comparison.city_2} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analytical Findings & Key Differences */}
          <div className="rounded-xl bg-[#0d1813] border border-[#182c21] p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Key Differences & Analytical Takeaways
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {comparison.key_differences.map((diff, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{diff}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-lg bg-[#08120d] border border-[#16291f] p-3 text-[11px] text-gray-400 flex items-start gap-2 mt-4">
              <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-300">Methodological Note & Transparency:</strong> {comparison.limitations}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
