import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api";
import { ReportItem } from "../types";

export const ReportsPage: React.FC = () => {
  const { activeDataset, latestPrediction, selectedCity } = useApp();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportType, setReportType] = useState<"pdf" | "csv">("pdf");
  const [title, setTitle] = useState<string>("GreenAir Executive Environmental Assessment");
  const [includeDataset, setIncludeDataset] = useState<boolean>(true);
  const [includePrediction, setIncludePrediction] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const loadReports = async () => {
    try {
      const list = await api.getReports();
      setReports(list);
    } catch (e) {
      console.warn("Failed to load reports:", e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const rep = await api.generateReport({
        report_type: reportType,
        title: title.trim() || "GreenAir Assessment",
        dataset_id: includeDataset && activeDataset ? activeDataset.id : undefined,
        prediction_id: includePrediction && latestPrediction ? latestPrediction.id : undefined,
      });

      setSuccessMsg(`Report '${rep.filename}' synthesized successfully.`);
      await loadReports();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate environmental report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          Automated Environmental Reports & Exports
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Synthesize verified machine-learning predictions, dataset statistics, time-series trends, and findings into PDF or CSV deliverables.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Generator Form & Recent Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (5 cols) */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4"
        >
          <div className="border-b border-[#162a1f] pb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Generate Assessment Deliverable</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Scope: {selectedCity || "India"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Compile current active session parameters and India location data into a standalone report.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Format Selector */}
            <div>
              <label className="text-gray-300 font-medium block mb-1">Deliverable Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("pdf")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 border transition-all ${
                    reportType === "pdf"
                      ? "bg-emerald-900/60 border-emerald-600 text-emerald-200"
                      : "bg-[#08120d] border-[#182c20] text-gray-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Executive PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("csv")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 border transition-all ${
                    reportType === "csv"
                      ? "bg-emerald-900/60 border-emerald-600 text-emerald-200"
                      : "bg-[#08120d] border-[#182c20] text-gray-400 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Data CSV Export</span>
                </button>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label className="text-gray-300 font-medium block mb-1">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. October Ambient Air Quality Assessment"
                className="w-full rounded-lg bg-[#08120d] border border-[#182c20] px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Inclusions */}
            <div className="space-y-2 pt-1">
              <label className="text-gray-300 font-medium block">Report Scope Inclusions</label>
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDataset}
                  onChange={(e) => setIncludeDataset(e.target.checked)}
                  className="rounded bg-[#08120d] border-[#1c3527] text-emerald-500 focus:ring-0"
                />
                <span>Include Active Dataset Statistics ({activeDataset ? activeDataset.filename : "None loaded"})</span>
              </label>
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrediction}
                  onChange={(e) => setIncludePrediction(e.target.checked)}
                  className="rounded bg-[#08120d] border-[#1c3527] text-emerald-500 focus:ring-0"
                />
                <span>Include Latest Prediction ({latestPrediction?.category || "None run"})</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950 transition-all mt-4"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? "Synthesizing Deliverable..." : `Generate ${reportType.toUpperCase()} Deliverable`}</span>
          </button>
        </form>

        {/* List of Generated Reports (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#162a1f] pb-3">
            <h3 className="text-sm font-semibold text-white">Generated Deliverables Archive</h3>
            <span className="text-[10px] font-mono text-gray-500">{reports.length} reports</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                <p className="text-xs">No reports generated yet. Use the form to synthesize your first report.</p>
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.report_id}
                  className="rounded-xl bg-[#08120d] border border-[#172b1f] p-4 space-y-2 hover:border-[#1f3d2b] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                        {rep.file_type === "pdf" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{rep.title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-sm">
                          {rep.filename}
                        </p>
                      </div>
                    </div>

                    <a
                      href={rep.download_url}
                      download
                      className="flex items-center gap-1.5 rounded-lg bg-[#14281f] hover:bg-emerald-600 text-emerald-300 hover:text-white border border-[#203f2e] px-3 py-1.5 text-xs font-medium transition-all shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono pt-1">
                    <span>Format: <span className="text-emerald-400 font-bold uppercase">{rep.file_type}</span></span>
                    <span>Size: {(rep.size_bytes / 1024).toFixed(1)} KB</span>
                    <span>Generated: {new Date(rep.generated_at).toLocaleString()}</span>
                  </div>

                  {rep.summary_findings && rep.summary_findings.length > 0 && (
                    <div className="pt-2 border-t border-[#122319] space-y-1">
                      {rep.summary_findings.slice(0, 2).map((finding, fIdx) => (
                        <p key={fIdx} className="text-[11px] text-gray-400 truncate">
                          • {finding}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
