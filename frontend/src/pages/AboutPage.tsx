import React from "react";
import {
  Info,
  ShieldCheck,
  Cpu,
  Layers,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const AboutPage: React.FC = () => {
  const { systemHealth } = useApp();

  const standards = [
    { pollutant: "PM2.5", standard: "60 µg/m³ (24-hr)", source: "Standard Benchmark", impact: "Microscopic particles penetrating deep into lungs and cardiovascular system." },
    { pollutant: "PM10", standard: "100 µg/m³ (24-hr)", source: "Standard Benchmark", impact: "Inhalable dust, pollen, and debris causing upper airway inflammation." },
    { pollutant: "NO2", standard: "80 µg/m³ (24-hr)", source: "Standard Benchmark", impact: "Combustion byproduct inducing bronchospasm and heightened asthma sensitivity." },
    { pollutant: "CO", standard: "2.0 mg/m³ (8-hr)", source: "Standard Benchmark", impact: "Binds hemoglobin to form carboxyhemoglobin, impairing cerebral oxygen delivery." },
    { pollutant: "SO2", standard: "80 µg/m³ (24-hr)", source: "Standard Benchmark", impact: "Pungent gas from coal/smelting triggering acute bronchoconstriction." },
    { pollutant: "O3", standard: "100 µg/m³ (8-hr)", source: "Standard Benchmark", impact: "Photochemical oxidant causing airway irritation and chest tightness on warm afternoons." },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Info className="h-5 w-5 text-emerald-400" />
          System Architecture, Model Specifications & Standards
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Technical specifications, environmental benchmarks, and machine-learning governance.
        </p>
      </div>

      {/* Grid: System Status & ML Model Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Learning Specs */}
        <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#162a1f] pb-3">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Machine Learning Model Architecture</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Estimator Type:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {systemHealth?.model.type || "RandomForestClassifier"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Feature Vector (n=6):</span>
              <span className="font-mono text-gray-200">PM2.5, PM10, NO2, CO, SO2, O3</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Target Classes (k=5):</span>
              <span className="font-mono text-gray-200">
                Satisfactory, Moderate, Poor, Very Poor, Severe
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Model File:</span>
              <span className="font-mono text-gray-300">backend/model/greenair_model.pkl</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Model State:</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {systemHealth?.model.is_fallback ? "Rule-Based Fallback" : "Trained Scikit-Learn Estimator Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Agent Orchestration */}
        <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#162a1f] pb-3">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">AI Agent Orchestration & Tool Calling</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Active AI Engine:</span>
              <span className="font-semibold text-emerald-400">
                {systemHealth?.ai_engine.active_provider || "Deterministic Fallback Engine"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Tool Registry:</span>
              <span className="text-gray-200">8 Allowlisted Pure-Python Tools</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Max Iterations Guardrail:</span>
              <span className="font-mono text-gray-200">6 Iterations per Prompt</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Supported LLM Backends:</span>
              <span className="text-gray-300">Groq (Llama-3.3-70b) / Gemini</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#132319]">
              <span className="text-gray-400">Offline Reliability:</span>
              <span className="text-emerald-400">100% Deterministic Real-Tool Execution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standards Reference Table */}
      <div className="rounded-xl bg-[#0c1813] border border-[#182e22] p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#162a1f] pb-3">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Ambient Environmental Benchmark Reference Standards</h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#172b1f]">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#08120d] text-gray-400 text-[10px] uppercase font-mono border-b border-[#172b1f]">
              <tr>
                <th className="px-3 py-2">Pollutant</th>
                <th className="px-3 py-2">Exposure Threshold</th>
                <th className="px-3 py-2">Standard Basis</th>
                <th className="px-3 py-2">Primary Physiological Health Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13241a] text-[11px]">
              {standards.map((s) => (
                <tr key={s.pollutant} className="hover:bg-[#0e1a14]">
                  <td className="px-3 py-2 font-bold text-emerald-400 font-mono">{s.pollutant}</td>
                  <td className="px-3 py-2 font-mono font-medium text-white">{s.standard}</td>
                  <td className="px-3 py-2 text-gray-400">{s.source}</td>
                  <td className="px-3 py-2 text-gray-300">{s.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Regulatory Distinction */}
      <div className="rounded-xl bg-[#171408] border border-amber-900/60 p-5 space-y-2">
        <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Regulatory & Scientific Governance Distinction
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          The <strong>GreenAir AI Agent</strong> predicts air quality categories based on trained supervised classification patterns learned by a Scikit-Learn Random Forest model. This classification is distinct from official statutory Multi-Pollutant Index (AQI) calculations mandated by regulatory authorities (such as US EPA or CPCB sub-index breakpoint algorithms). Official AQI calculations involve statutory piecewise-linear interpolation and strict averaging periods (e.g. 24-hour truncated means). GreenAir is intended for decision support, rapid exploratory analysis, and environmental intelligence.
        </p>
      </div>
    </div>
  );
};
