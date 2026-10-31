import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  Calendar,
  Sparkles,
  DownloadCloud,
  Globe,
  Radio,
  Building2,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api";
import { DatasetItem } from "../types";

const POPULAR_CITIES = [
  "Chennai",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Coimbatore",
  "Hosur",
  "Hyderabad",
  "Kolkata",
  "Jaipur",
];

export const DatasetPage: React.FC = () => {
  const {
    datasets,
    loadDatasets,
    activeDataset,
    selectDataset,
    loadSyntheticDemo,
    isLoading,
    selectedCity,
    importCpcbForCity,
    importOpenMeteoForCity,
  } = useApp();

  const [uploading, setUploading] = useState<boolean>(false);
  const [importingCity, setImportingCity] = useState<string>(selectedCity || "Chennai");
  const [importLoading, setImportLoading] = useState<"cpcb" | "openmeteo" | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const summary = await api.uploadDataset(file);
      await loadDatasets();
      selectDataset(summary);
      setUploadSuccess(`Successfully ingested '${file.name}' with ${summary.row_count} records.`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and parse dataset.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleImportCpcb = async () => {
    setImportLoading("cpcb");
    setUploadError("");
    setUploadSuccess("");
    try {
      const ds = await importCpcbForCity(importingCity);
      setUploadSuccess(
        `Successfully imported official CPCB Continuous Ambient Air Quality Monitoring Station observations for ${importingCity} (${ds.row_count} stations).`
      );
    } catch (err: any) {
      setUploadError(err.message || `Failed to import CPCB observations for ${importingCity}.`);
    } finally {
      setImportLoading(null);
    }
  };

  const handleImportOpenMeteo = async () => {
    setImportLoading("openmeteo");
    setUploadError("");
    setUploadSuccess("");
    try {
      const ds = await importOpenMeteoForCity(importingCity);
      setUploadSuccess(
        `Successfully imported 72-hour hourly atmospheric model series for ${importingCity} (${ds.row_count} hourly points).`
      );
    } catch (err: any) {
      setUploadError(err.message || `Failed to import Open-Meteo series for ${importingCity}.`);
    } finally {
      setImportLoading(null);
    }
  };

  const getSourceBadge = (ds: DatasetItem) => {
    const isSynth = ds.is_synthetic || ds.filename.toLowerCase().includes("synthetic");
    const isCpcb = ds.source_type === "cpcb_ground" || ds.filename.toLowerCase().includes("cpcb");
    const isOm = ds.source_type === "open_meteo_model" || ds.filename.toLowerCase().includes("openmeteo");

    if (isSynth) {
      return (
        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
          Synthetic Demo
        </span>
      );
    }
    if (isCpcb) {
      return (
        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
          CPCB Ground
        </span>
      );
    }
    if (isOm) {
      return (
        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700">
          Open-Meteo 72h
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
        User Upload
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Environmental Dataset Ingestion & Active Dataset Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Import official CPCB ground monitoring observations, Open-Meteo atmospheric forecasts, upload CSV/Excel files, or test with the synthetic demo dataset.
          </p>
        </div>

        <button
          onClick={loadSyntheticDemo}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-[#14261d] hover:bg-[#1b3628] border border-[#234533] px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all shadow-md shrink-0"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{isLoading ? "Loading..." : "Load Synthetic Demo Dataset"}</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Real-World Data Ingestion Hub Banner */}
      <div className="rounded-2xl bg-[#091510] border border-[#1b3829] p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400">
              <DownloadCloud className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Import Real-World Environmental Data Into Active Dataset
              </h3>
              <p className="text-[11px] text-gray-400">
                Pivots tall API observations into verified wide-format tables. Preserves source, units, and missing values.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Target City:</span>
            <select
              value={importingCity}
              onChange={(e) => setImportingCity(e.target.value)}
              className="rounded-lg bg-[#0d1f16] border border-[#204030] px-2.5 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleImportCpcb}
            disabled={importLoading !== null}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
          >
            <Radio className="h-4 w-4 text-emerald-300" />
            <span>
              {importLoading === "cpcb" ? "Importing CPCB Stations..." : `Import ${importingCity} CPCB Observations`}
            </span>
          </button>

          <button
            onClick={handleImportOpenMeteo}
            disabled={importLoading !== null}
            className="flex items-center gap-2 rounded-xl bg-[#10241b] hover:bg-[#183528] border border-[#234835] px-3.5 py-2 text-xs font-semibold text-sky-300 transition-all shadow-md disabled:opacity-50"
          >
            <Clock className="h-4 w-4 text-sky-400" />
            <span>
              {importLoading === "openmeteo" ? "Importing Open-Meteo Series..." : `Import ${importingCity} 72h Open-Meteo Series`}
            </span>
          </button>
        </div>
      </div>

      {/* Upload Zone & Dataset Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Box (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#0c1813] border border-[#182e22] p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Upload Custom Dataset</h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Supported formats: .csv, .xlsx, .xls. Max size 15MB.
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#203a2c] hover:border-emerald-500 rounded-xl p-6 cursor-pointer bg-[#08120d] hover:bg-[#0b1711] transition-all group">
              <UploadCloud className="h-9 w-9 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">
                {uploading ? "Ingesting & Auditing File..." : "Click or Drag File to Upload"}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">
                CSV or Excel with air pollutant columns
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* List of Available Datasets */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Registered Datasets ({datasets.length})</h4>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {datasets.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-2">No datasets in registry.</p>
              ) : (
                datasets.map((ds) => {
                  const isSelected = activeDataset?.id === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => selectDataset(ds)}
                      className={`flex items-center justify-between rounded-lg p-2.5 text-xs cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-[#14281f] border-emerald-600 text-white shadow-sm"
                          : "bg-[#09120e] border-[#16271e] text-gray-400 hover:bg-[#0f1d16] hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 mr-2">
                        <FileSpreadsheet
                          className={`h-4 w-4 shrink-0 ${isSelected ? "text-emerald-400" : "text-gray-500"}`}
                        />
                        <div className="truncate">
                          <p className="truncate font-medium text-white">{ds.filename}</p>
                          <p className="text-[10px] text-gray-400">{ds.row_count} rows • {ds.data_quality_score}/100</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getSourceBadge(ds)}
                        {isSelected && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selected Dataset Inspection (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-5">
          {activeDataset ? (
            <>
              {/* Dataset Header Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162a1f] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">{activeDataset.filename}</h3>
                    {getSourceBadge(activeDataset)}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>{activeDataset.row_count} observations</span>
                    <span>• {activeDataset.column_count} columns</span>
                    {activeDataset.has_timestamps && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {activeDataset.is_time_series !== false ? "Time-series (Chronological)" : "Spatial Snapshot"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Quality Score Badge */}
                <div className="flex items-center gap-2 rounded-xl bg-[#09120e] border border-[#172b20] p-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Quality Index</p>
                    <p className="text-lg font-bold text-emerald-400">{activeDataset.data_quality_score}/100</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Source Provenance Callout */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  activeDataset.is_synthetic || activeDataset.filename.toLowerCase().includes("synthetic")
                    ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                    : activeDataset.source_type === "cpcb_ground" || activeDataset.filename.toLowerCase().includes("cpcb")
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                    : "bg-sky-950/40 border-sky-800/60 text-sky-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    {activeDataset.is_synthetic || activeDataset.filename.toLowerCase().includes("synthetic")
                      ? "Notice: Synthetic Demonstration Dataset"
                      : activeDataset.source_type === "cpcb_ground" || activeDataset.filename.toLowerCase().includes("cpcb")
                      ? "Official Government CAAQMS Ground Observations"
                      : "Atmospheric Numerical Model Time-Series"}
                  </span>
                </div>
                <p className="text-[11px] opacity-90">
                  {activeDataset.source_description ||
                    (activeDataset.is_synthetic
                      ? "Simulated sample measurements generated for UI and algorithm demonstrations."
                      : "Ingested environmental dataset registered in GreenAir.")}
                </p>
              </div>

              {/* Quality Indicators Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#09120e] border border-[#16291e] p-2.5">
                  <p className="text-[10px] text-gray-400">Missing Values</p>
                  <p className="text-base font-bold text-white mt-0.5">{activeDataset.missing_values_count}</p>
                </div>
                <div className="rounded-lg bg-[#09120e] border border-[#16291e] p-2.5">
                  <p className="text-[10px] text-gray-400">Duplicate Rows</p>
                  <p className="text-base font-bold text-white mt-0.5">{activeDataset.duplicate_rows_count}</p>
                </div>
                <div className="rounded-lg bg-[#09120e] border border-[#16291e] p-2.5">
                  <p className="text-[10px] text-gray-400">Pollutants Mapped</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {activeDataset.pollutant_columns.length}/6
                  </p>
                </div>
              </div>

              {/* Quality Warnings */}
              {activeDataset.quality_warnings.length > 0 && (
                <div className="rounded-lg bg-[#1a1208] border border-amber-900/60 p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Data Quality Warnings
                  </p>
                  {activeDataset.quality_warnings.map((w, wIdx) => (
                    <p key={wIdx} className="text-[11px] text-amber-200/90 pl-5">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Pollutant Statistical Distributions */}
              <div>
                <h4 className="text-xs font-semibold text-white mb-2">Descriptive Distributions (Mapped Parameters)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(activeDataset.pollutant_stats).map(([pollutant, stats]) => (
                    <div key={pollutant} className="rounded-lg bg-[#09120e] border border-[#16271e] p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">{pollutant}</span>
                        <span className="text-[10px] text-gray-400">n={stats.count}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300">
                        <div>Mean: <span className="font-semibold text-white">{stats.mean}</span></div>
                        <div>Med: <span className="font-semibold text-white">{stats.median}</span></div>
                        <div>Min: <span className="font-semibold text-white">{stats.min}</span></div>
                        <div>Max: <span className="font-semibold text-white">{stats.max}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview Table */}
              {activeDataset.preview_rows.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-white mb-2">Dataset Preview (First 10 Rows)</h4>
                  <div className="overflow-x-auto rounded-lg border border-[#16271e] bg-[#08120d]">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#0e1b15] text-gray-400 border-b border-[#16271e]">
                        <tr>
                          {Object.keys(activeDataset.preview_rows[0]).slice(0, 7).map((col) => (
                            <th key={col} className="px-3 py-2 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#14231b] text-gray-300">
                        {activeDataset.preview_rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#0c1a13]">
                            {Object.values(row).slice(0, 7).map((val: any, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 font-mono text-[10px] whitespace-nowrap">
                                {val !== null && val !== undefined ? String(val) : <span className="text-gray-600">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-gray-500">
              <Layers className="h-10 w-10 mx-auto text-gray-600 mb-2" />
              <p className="text-xs">Select or import a dataset to view quality audit metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
