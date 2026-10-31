import React, { useState, useEffect } from "react";
import {
  MapPin,
  RefreshCw,
  Search,
  Factory,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { StatusBadge } from "./StatusBadge";
import { api } from "../api";
import { LocationItem, CityAirQualityResponse } from "../types";

const QUICK_CITIES = [
  "Chennai",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Coimbatore",
  "Hosur",
  "Thoothukudi",
  "Kolkata",
  "Hyderabad",
  "Jaipur",
];

export const IndiaLiveAirCard: React.FC = () => {
  const {
    selectedCity,
    liveCityData,
    loadCityAirQuality,
    isCityLoading,
    applyCityToInputs,
    applyStationToInputs,
    importCpcbForCity,
    setActivePage,
    dataGovStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [emissionFilter, setEmissionFilter] = useState<"air" | "water" | "all">("air");
  const [activeTab, setActiveTab] = useState<"overview" | "forecast" | "industrial" | "datagov">("overview");

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchLocations(searchQuery);
        setSearchResults(res);
      } catch (err) {
        console.warn("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc: LocationItem | string) => {
    const name = typeof loc === "string" ? loc : loc.name;
    loadCityAirQuality(name);
    setSearchQuery("");
    setSearchResults([]);
  };

  const om = liveCityData?.open_meteo;
  const loc = liveCityData?.location;
  const ml = liveCityData?.ml_classification;
  const tnpcbList = liveCityData?.tnpcb_industries || [];
  const cpcbData = liveCityData?.data_gov_in;
  const cpcbStations: any[] = cpcbData?.stations || [];

  // Filter industrial facilities
  const filteredIndustries = tnpcbList.filter((ind) => {
    if (emissionFilter === "all") return true;
    const type = (ind.emmision_type || "").toLowerCase();
    if (emissionFilter === "air") return type.includes("air") || type.includes("both");
    if (emissionFilter === "water") return type.includes("water") || type.includes("both");
    return true;
  });

  // Prepare forecast chart data
  const forecastChartData = (liveCityData?.hourly_forecast || []).map((pt) => {
    const d = new Date(pt.time);
    const timeLabel = `${d.getHours().toString().padStart(2, "0")}:00 (${d.toLocaleDateString("en-US", { weekday: "short" })})`;
    return {
      time: timeLabel,
      pm2_5: pt.pm2_5,
      pm10: pt.pm10,
      no2: pt.no2,
      co: pt.co_mgm3,
    };
  });

  return (
    <div className="rounded-2xl bg-[#0c1813] border border-[#1b3427] p-5 md:p-6 shadow-xl space-y-5">
      {/* Header with Search and Quick Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#162a1f] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              India Real-Time Atmospheric & Industrial Intelligence
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Ground-station observations, Open-Meteo atmospheric models, and TNPCB OCEMS industrial monitoring.
          </p>
        </div>

        {/* Search Input & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Indian city or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#08120d] border border-[#1f3b2c] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-10 z-50 rounded-xl bg-[#0a1611] border border-[#213f2f] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(r)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#12241b] text-gray-200 border-b border-[#14261c] last:border-none flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{r.name}</span>
                      <span className="text-[10px] text-gray-400 ml-1.5">
                        {r.state ? `${r.state}, ` : ""}India
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">
                      {r.latitude.toFixed(2)}°N, {r.longitude.toFixed(2)}°E
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => loadCityAirQuality(selectedCity, true)}
            disabled={isCityLoading}
            title="Force refresh live readings"
            className="flex items-center gap-1 rounded-xl bg-[#12241b] border border-[#1f3b2c] px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-[#183124] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCityLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick City Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider shrink-0 mr-1">
          Quick Hubs:
        </span>
        {QUICK_CITIES.map((c) => {
          const isSelected = selectedCity.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => handleSelectLocation(c)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium shrink-0 transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950"
                  : "bg-[#091510] border border-[#1a3224] text-gray-300 hover:bg-[#12261c] hover:text-white"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Selected Location Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#09140f] border border-[#182d21] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {loc?.name || selectedCity}
              </h3>
              {loc?.state && (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {loc.state}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
              Coordinates: {loc?.latitude ?? "--"}°N, {loc?.longitude ?? "--"}°E | Retrieved:{" "}
              {liveCityData?.retrieved_at ? new Date(liveCityData.retrieved_at).toLocaleTimeString() : "--"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ml && (
            <div className="flex items-center gap-2 rounded-lg bg-[#102219] border border-[#1d3d2c] px-3 py-1.5">
              <span className="text-[11px] text-gray-400">GreenAir ML:</span>
              <StatusBadge category={ml.category} size="sm" />
              <span className="text-xs font-bold text-white">{ml.confidence_pct.toFixed(0)}%</span>
            </div>
          )}

          <button
            onClick={() => {
              applyCityToInputs();
              setActivePage("predict");
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Apply to ML Lab</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#16271e] pb-1 text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-[#102219] text-emerald-300 border-t-2 border-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Atmospheric Readings
        </button>
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
            activeTab === "forecast"
              ? "bg-[#102219] text-emerald-300 border-t-2 border-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          48-Hour Forecast & History
        </button>
        <button
          onClick={() => setActiveTab("industrial")}
          className={`px-3 py-1.5 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === "industrial"
              ? "bg-[#102219] text-emerald-300 border-t-2 border-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Factory className="h-3.5 w-3.5 text-amber-400" />
          <span>TNPCB Industrial Stacks</span>
          {tnpcbList.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-950 text-amber-400 px-1.5 py-0.2 text-[10px] font-mono border border-amber-800">
              {tnpcbList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("datagov")}
          className={`px-3 py-1.5 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === "datagov"
              ? "bg-[#102219] text-emerald-300 border-t-2 border-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-blue-400" />
          <span>CPCB Ground Stations</span>
          {cpcbStations.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-950 text-blue-400 px-1.5 py-0.2 text-[10px] font-mono border border-blue-800">
              {cpcbStations.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content 1: Atmospheric Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* PM2.5 */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">PM2.5</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.pm2_5 ?? "--"}</span>
                <span className="text-[10px] text-gray-400">µg/m³</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Fine Particulate</p>
            </div>

            {/* PM10 */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">PM10</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.pm10 ?? "--"}</span>
                <span className="text-[10px] text-gray-400">µg/m³</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Coarse Particulate</p>
            </div>

            {/* NO2 */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">NO2</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.nitrogen_dioxide ?? "--"}</span>
                <span className="text-[10px] text-gray-400">µg/m³</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Nitrogen Dioxide</p>
            </div>

            {/* CO */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">CO</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.carbon_monoxide_mgm3 ?? "--"}</span>
                <span className="text-[10px] text-gray-400">mg/m³</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">({om?.carbon_monoxide ?? "--"} µg/m³)</p>
            </div>

            {/* SO2 */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">SO2</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.sulphur_dioxide ?? "--"}</span>
                <span className="text-[10px] text-gray-400">µg/m³</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Sulfur Dioxide</p>
            </div>

            {/* O3 */}
            <div className="rounded-xl bg-[#091510] border border-[#162a1f] p-3">
              <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Ozone (O3)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{om?.ozone ?? "--"}</span>
                <span className="text-[10px] text-gray-400">µg/m³</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Ground Ozone</p>
            </div>
          </div>

          {/* Source Attribution Notice */}
          <div className="rounded-xl bg-[#09130f] border border-[#172b20] p-3 text-xs text-gray-400 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-gray-300 font-medium">Source Attribution & Numerical Model Transparency</p>
              <p className="text-[11px]">
                Atmospheric concentrations are supplied by the <strong>Open-Meteo Air Quality Numerical API</strong> (CAMS European atmospheric dispersion model) based on coordinates {loc?.latitude}°N, {loc?.longitude}°E.
                These readings are distinct from localized government ground-monitoring stations (CPCB).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Forecast & Hourly Trajectory */}
      {activeTab === "forecast" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white">48-Hour Hourly Trajectory & Forecast Model</h4>
            <span className="text-[10px] font-mono text-gray-400">Open-Meteo Atmospheric Forecast</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} minTickGap={30} />
                <YAxis stroke="#4b5563" fontSize={10} unit=" µg" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b1712", borderColor: "#1b3326", borderRadius: "8px", fontSize: "11px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="pm2_5" stroke="#10b981" fillOpacity={1} fill="url(#colorPm25)" name="PM2.5 (µg/m³)" />
                <Area type="monotone" dataKey="pm10" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPm10)" name="PM10 (µg/m³)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Content 3: TNPCB Industrial Stacks Layer */}
      {activeTab === "industrial" && (
        <div className="space-y-4">
          {/* CRITICAL REGULATORY DISCLAIMER */}
          <div className="rounded-xl bg-amber-950/40 border border-amber-800/80 p-3.5 text-xs text-amber-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                Critical Distinction: Point-Source Stack Emissions vs. Ambient City AQI
              </p>
              <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                The parameters below are recorded at factory flues, boiler chimneys, and industrial discharge outlets by the <strong>Tamil Nadu Pollution Control Board (TNPCB OCEMS)</strong>.
                They measure concentrated point-source effluent and are <strong>strictly NOT interchangeable</strong> with city-wide ambient air quality or general human exposure levels.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Filter Emission:</span>
              {(["air", "water", "all"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEmissionFilter(mode)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                    emissionFilter === mode
                      ? "bg-amber-600 text-white font-bold"
                      : "bg-[#0a1510] border border-[#1b3225] text-gray-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-gray-400">
              Showing {filteredIndustries.length} facilities in {loc?.district || loc?.name}
            </span>
          </div>

          {/* Industrial Facilities Grid */}
          {filteredIndustries.length === 0 ? (
            <div className="rounded-xl bg-[#09140f] border border-[#16271e] p-8 text-center text-gray-400 text-xs">
              No industrial facilities with '{emissionFilter}' emissions found in this locality or the locality is outside Tamil Nadu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredIndustries.map((ind) => (
                <div key={ind.id} className="rounded-xl bg-[#091510] border border-[#162b20] p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-white leading-snug">{ind.name}</h5>
                      <p className="text-[10px] text-gray-400">{ind.city} • Regional Office: {ind.spcb_regional_office || "TNPCB"}</p>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#13261c] text-emerald-400 border border-[#1c3829] shrink-0">
                      {ind.emmision_type || "Air"}
                    </span>
                  </div>

                  {/* Monitored Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    {ind.parameters.map((p, pIdx) => (
                      <div key={pIdx} className="rounded bg-[#060e0a] border border-[#14231b] p-1.5">
                        <span className="text-[9px] font-semibold text-gray-400">{p.name}</span>
                        <div className="text-xs font-mono font-bold text-white">
                          {p.current !== null && p.current !== undefined ? p.current : "--"}
                          <span className="text-[9px] font-normal text-gray-400 ml-0.5">{p.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-gray-500 font-mono">
                    Last Device Update: {ind.last_update_date || "Live Online"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: data.gov.in / CPCB Ground Stations */}
      {activeTab === "datagov" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#091510] border border-[#16291f] p-4 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-white text-sm">
                  Official CPCB Ground Monitoring Stations (data.gov.in)
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                dataGovStatus?.configured
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : "bg-amber-950 text-amber-400 border-amber-800"
              }`}>
                {dataGovStatus?.configured ? "ACTIVE & STREAMING" : "UNCONFIGURED"}
              </span>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed">
              Official continuous ambient air quality monitoring station (CAAQMS) observations published by the <strong>Central Pollution Control Board (CPCB)</strong>.
              These represent actual physical sensor measurements on the ground, separate from atmospheric numerical models and factory stack emissions.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400 pt-2 border-t border-[#14231b]">
              <div className="flex flex-wrap items-center gap-4">
                <span><strong>Resource ID:</strong> <code className="text-blue-300">{dataGovStatus?.configured_resource_id || "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"}</code></span>
                <span><strong>Reporting Stations in {loc?.name || selectedCity}:</strong> <span className="text-white font-bold">{cpcbStations.length}</span></span>
              </div>
              {cpcbStations.length > 0 && (
                <button
                  onClick={async () => {
                    await importCpcbForCity(loc?.name || selectedCity);
                    setActivePage("datasets");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <Building2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Save {loc?.name || selectedCity} Stations as Active Dataset</span>
                </button>
              )}
            </div>
          </div>

          {/* CPCB Stations List */}
          {cpcbStations.length === 0 ? (
            <div className="rounded-xl bg-[#09140f] border border-[#16271e] p-8 text-center text-gray-400 text-xs">
              No central CPCB CAAQMS ground monitoring stations are currently reporting records for <strong>{loc?.name || selectedCity}</strong>.
              Regional atmospheric model data (Open-Meteo) remains active above.
            </div>
          ) : (
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {cpcbStations.map((st, idx) => (
                <div key={idx} className="rounded-xl bg-[#091510] border border-[#162b20] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14261c] pb-2.5">
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span>{st.station_name}</span>
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {st.city}, {st.state} • Coordinates: {st.latitude ?? "--"}°N, {st.longitude ?? "--"}°E
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => applyStationToInputs(st)}
                        className="text-[10px] bg-[#12261b] hover:bg-[#1a3827] border border-[#234b34] text-emerald-300 font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Apply Station to Dashboard
                      </button>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                        Updated: {st.last_update || "Recent"}
                      </span>
                    </div>
                  </div>

                  {/* Pollutant Observations Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {Object.entries(st.pollutants || {}).map(([pollutant, vals]: [string, any], pIdx) => (
                      <div key={pIdx} className="rounded-lg bg-[#060e0a] border border-[#14231b] p-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                          {pollutant}
                        </span>
                        <div className="text-sm font-mono font-bold text-white mt-0.5">
                          {vals.avg !== null && vals.avg !== undefined ? vals.avg : "--"}
                          <span className="text-[9px] font-normal text-gray-400 ml-0.5">{vals.unit}</span>
                        </div>
                        {(vals.min !== null || vals.max !== null) && (
                          <span className="text-[9px] text-gray-500 font-mono block mt-0.5">
                            [{vals.min ?? "--"} - {vals.max ?? "--"}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
