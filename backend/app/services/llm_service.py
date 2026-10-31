import os
import json
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx

from backend.app.config import settings
from backend.app.agent.tool_registry import TOOL_SCHEMAS, execute_tool
from backend.app.agent.system_prompt import GREENAIR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class LLMService:
    @staticmethod
    def is_provider_available() -> Tuple[bool, str]:
        """Check if an external LLM API key is configured."""
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
            return True, "groq"
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5:
            return True, "gemini"
        return False, "offline_fallback"

    @classmethod
    async def call_groq(
        cls,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Execute chat completion with Groq API supporting function calling."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1500,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"Groq API error ({resp.status_code}): {resp.text}")
                raise RuntimeError(f"Groq API call returned status {resp.status_code}: {resp.text}")
            return resp.json()

    @classmethod
    async def call_gemini(
        cls,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Execute chat completion with Gemini REST API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        
        # Convert messages to Gemini contents format
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

        payload = {"contents": contents}

        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"Gemini API error ({resp.status_code}): {resp.text}")
                raise RuntimeError(f"Gemini API error {resp.status_code}: {resp.text}")
            data = resp.json()
            
            # Extract text
            text = ""
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                text = str(data)
                
            return {
                "choices": [{
                    "message": {"role": "assistant", "content": text},
                    "finish_reason": "stop"
                }]
            }

    @classmethod
    def run_deterministic_agent(
        cls,
        user_message: str,
        active_dataset_id: Optional[str] = None,
        latest_pollutants: Optional[Dict[str, float]] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Deterministic intent-driven agent engine.
        Invoked when no LLM API key is configured.
        Parses intent, runs the real allowlisted tools, and synthesizes grounded answers.
        """
        msg_lower = user_message.lower()
        tools_executed = []
        data_refs = {}

        # Known Indian cities for intent routing
        known_cities = [
            "chennai", "delhi", "mumbai", "bengaluru", "kolkata", "hyderabad", "ahmedabad",
            "pune", "jaipur", "lucknow", "kanpur", "coimbatore", "madurai", "hosur",
            "thoothukudi", "salem", "tirunelveli", "patna", "chandigarh", "bhopal",
            "visakhapatnam", "tiruppur", "erode", "vellore", "trichy", "tiruchirappalli", "ranipet"
        ]

        found_cities = [c.capitalize() for c in known_cities if c in msg_lower]

        # 0A. Intent: Indian Cities Comparison
        if "compare" in msg_lower and len(found_cities) >= 2:
            city_1 = found_cities[0]
            city_2 = found_cities[1]
            out, ms, ok, err = execute_tool("compare_cities", {"city_1": city_1, "city_2": city_2})
            tools_executed.append({
                "tool_name": "compare_cities",
                "tool_arguments": {"city_1": city_1, "city_2": city_2},
                "output": out,
                "execution_time_ms": ms,
                "success": ok,
                "error": err,
            })
            if ok and out:
                metrics = out.get("comparison_metrics", {})
                diffs_text = "\n".join([f"- {d}" for d in out.get("key_differences", [])])
                resp = (
                    f"### ⚖️ Side-by-Side Air Quality Comparison: **{city_1}** vs **{city_2}**\n\n"
                    f"**GreenAir ML Category:**\n"
                    f"- **{city_1}:** {out.get('ml_class_1')}\n"
                    f"- **{city_2}:** {out.get('ml_class_2')}\n\n"
                    f"**Key Metrics Comparison:**\n"
                )
                for p_name, p_data in metrics.items():
                    v1 = p_data.get(city_1, "N/A")
                    v2 = p_data.get(city_2, "N/A")
                    unit = p_data.get("unit", "")
                    pct = p_data.get("pct_change", 0)
                    resp += f"- **{p_name}:** {city_1} = {v1} {unit} | {city_2} = {v2} {unit} ({pct:+.1f}%)\n"

                resp += (
                    f"\n**Analytical Findings:**\n{diffs_text}\n\n"
                    f"> **Transparency Notice:** {out.get('limitations')}"
                )
                return resp, tools_executed

        # 0B. Intent: TNPCB Industrial Stack Monitoring
        if any(k in msg_lower for k in ["tnpcb", "industry", "industrial", "stack", "factory", "factories", "ocems", "effluent"]):
            tn_city = found_cities[0] if found_cities else "Hosur"
            out, ms, ok, err = execute_tool("get_tnpcb_industrial_emissions", {"city": tn_city, "emission_type": "air"})
            tools_executed.append({
                "tool_name": "get_tnpcb_industrial_emissions",
                "tool_arguments": {"city": tn_city, "emission_type": "air"},
                "output": out,
                "execution_time_ms": ms,
                "success": ok,
                "error": err,
            })
            if ok and out:
                count = out.get("industry_count", 0)
                inds = out.get("industries", [])
                sample_lines = []
                for ind in inds[:5]:
                    params_str = ", ".join([f"{p['name']}: {p['current']} {p['unit']}" for p in ind.get("parameters", [])[:3]])
                    sample_lines.append(f"- **{ind.get('industry_name')}** ({ind.get('district')}): {params_str or 'Online'}")

                sample_text = "\n".join(sample_lines) if sample_lines else "- No specific air emission installations matched filter in this location."
                resp = (
                    f"### 🏭 TNPCB OCEMS Industrial Monitoring — **{tn_city}**\n\n"
                    f"Retrieved **{count}** industrial facilities from the official Tamil Nadu Pollution Control Board public portal.\n\n"
                    f"**Sample Monitored Facilities & Parameters:**\n{sample_text}\n\n"
                    f"> **⚠️ CRITICAL REGULATORY DISTINCTION:**\n"
                    f"> {out.get('disclaimer')}\n"
                    f"> *Stack emissions are point-source measurements and must not be conflated with city-wide ambient air quality.*"
                )
                return resp, tools_executed

        # 0B2. Intent: Official CPCB Ground Observations (data.gov.in)
        if any(k in msg_lower for k in ["cpcb", "station", "ground observation", "data.gov", "datagov", "government observation", "official observation"]):
            cpcb_city = found_cities[0] if found_cities else "Chennai"
            out, ms, ok, err = execute_tool("get_cpcb_ground_observations", {"city": cpcb_city})
            tools_executed.append({
                "tool_name": "get_cpcb_ground_observations",
                "tool_arguments": {"city": cpcb_city},
                "output": out,
                "execution_time_ms": ms,
                "success": ok,
                "error": err,
            })
            if ok and out:
                st_count = out.get("stations_count", 0)
                sts = out.get("stations", [])
                lines = []
                for s in sts[:4]:
                    p_summary = ", ".join([f"{p}: {v.get('avg')} {v.get('unit')}" for p, v in s.get("pollutants", {}).items() if v.get("avg") is not None][:4])
                    lines.append(f"- **{s.get('station_name')}:** {p_summary or 'Active'} *(Updated: {s.get('last_update')})*")
                lines_text = "\n".join(lines) if lines else "- No active CAAQMS stations reported records for this city."
                resp = (
                    f"### 🏛️ Official CPCB Ground Monitoring Observations — **{cpcb_city}**\n\n"
                    f"Retrieved **{st_count}** government Continuous Ambient Air Quality Monitoring Stations (CAAQMS) from **data.gov.in**.\n\n"
                    f"**Station Ground Readings:**\n{lines_text}\n\n"
                    f"> **Data Source & Authority:** Central Pollution Control Board (CPCB) / State PCB CAAQMS Network (Resource `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`).\n"
                    f"> *Notice: These represent actual ground-level sensor measurements, distinct from numerical dispersion models.*"
                )
                return resp, tools_executed

        # 0C. Intent: Live Indian City Air Quality Lookup
        if found_cities and (any(k in msg_lower for k in ["air", "quality", "pollution", "live", "current", "weather", "aqi", "today", "how is", "what is"]) or len(user_message.split()) <= 4):
            city_target = found_cities[0]
            out, ms, ok, err = execute_tool("get_live_city_air_quality", {"city": city_target})
            tools_executed.append({
                "tool_name": "get_live_city_air_quality",
                "tool_arguments": {"city": city_target},
                "output": out,
                "execution_time_ms": ms,
                "success": ok,
                "error": err,
            })
            if ok and out:
                loc = out.get("location", {})
                om = out.get("open_meteo") or {}
                ml = out.get("ml_classification") or {}
                tn_inds = out.get("tnpcb_industries", [])

                cat = ml.get("category", "Moderate")
                conf = ml.get("confidence_pct", 0)

                resp = (
                    f"### 🏙️ Real-Time Air Quality: **{loc.get('name')}**, {loc.get('state')} (India)\n"
                    f"- **Coordinates:** {loc.get('latitude')}°N, {loc.get('longitude')}°E\n"
                    f"- **GreenAir ML Model Classification:** **{cat}** (Confidence: {conf:.1f}%)\n\n"
                    f"**Atmospheric Pollutant Concentrations (Open-Meteo Model):**\n"
                    f"- **PM2.5:** {om.get('pm2_5')} µg/m³\n"
                    f"- **PM10:** {om.get('pm10')} µg/m³\n"
                    f"- **NO2:** {om.get('nitrogen_dioxide')} µg/m³\n"
                    f"- **CO:** {om.get('carbon_monoxide_mgm3')} mg/m³ ({om.get('carbon_monoxide')} µg/m³ raw)\n"
                    f"- **SO2:** {om.get('sulphur_dioxide')} µg/m³\n"
                    f"- **O3 (Ozone):** {om.get('ozone')} µg/m³\n"
                )
                if tn_inds:
                    resp += f"\n**🏭 Industrial Context (TNPCB OCEMS):** {len(tn_inds)} industrial installations monitored in this district.\n"

                resp += (
                    f"\n**Source Transparency & Attribution:**\n"
                    f"- *Atmospheric Data Source:* Open-Meteo Air Quality Numerical Model (retrieved {out.get('retrieved_at')[:19]}Z).\n"
                    f"- *Classification Engine:* GreenAir Scikit-learn RandomForest Model.\n"
                    f"- *Notice:* These modelled readings are distinct from official CPCB ground monitoring stations."
                )
                return resp, tools_executed

        # 1. Intent: Air Quality Prediction
        # E.g. "predict air quality for PM2.5 45, PM10 80..." or "what is the air quality with PM2.5 30..."
        if any(k in msg_lower for k in ["predict", "classification", "forecast", "classify"]) or (
            latest_pollutants and any(k in msg_lower for k in ["what is the air", "air quality category", "air condition"])
        ):
            # Extract numbers if present, else use latest_pollutants or defaults
            defaults = {"PM2.5": 30.0, "PM10": 50.0, "NO2": 20.0, "CO": 0.5, "SO2": 10.0, "O3": 30.0}
            if latest_pollutants:
                defaults.update(latest_pollutants)

            extracted = cls._extract_pollutant_values(user_message, defaults)
            
            out, ms, ok, err = execute_tool("predict_air_quality", {
                "pm25": extracted["PM2.5"],
                "pm10": extracted["PM10"],
                "no2": extracted["NO2"],
                "co": extracted["CO"],
                "so2": extracted["SO2"],
                "o3": extracted["O3"],
            })
            
            tools_executed.append({
                "tool_name": "predict_air_quality",
                "tool_arguments": extracted,
                "output": out,
                "execution_time_ms": ms,
                "success": ok,
                "error": err,
            })

            # Also run pollutant analysis to see dominant driver
            p_out, p_ms, p_ok, p_err = execute_tool("analyze_pollutants", {
                "pm25": extracted["PM2.5"],
                "pm10": extracted["PM10"],
                "no2": extracted["NO2"],
                "co": extracted["CO"],
                "so2": extracted["SO2"],
                "o3": extracted["O3"],
            })
            tools_executed.append({
                "tool_name": "analyze_pollutants",
                "tool_arguments": extracted,
                "output": p_out,
                "execution_time_ms": p_ms,
                "success": p_ok,
                "error": p_err,
            })

            cat = out.get("category", "Moderate") if out else "Moderate"
            conf = out.get("confidence_pct", 0) if out else 0
            guidance = out.get("health_guidance", "") if out else ""
            dominant = p_out.get("dominant_pollutant", "PM2.5") if p_out else "PM2.5"

            resp = (
                f"### 🌿 Air Quality Classification: **{cat}** (Confidence: {conf:.1f}%)\n\n"
                f"Based on the evaluated pollutant readings:\n"
                f"- **PM2.5:** {extracted['PM2.5']} µg/m³\n"
                f"- **PM10:** {extracted['PM10']} µg/m³\n"
                f"- **NO2:** {extracted['NO2']} µg/m³\n"
                f"- **CO:** {extracted['CO']} mg/m³\n"
                f"- **SO2:** {extracted['SO2']} µg/m³\n"
                f"- **O3:** {extracted['O3']} µg/m³\n\n"
                f"**Key Finding:** **{dominant}** is the primary relative driver according to ambient threshold standards.\n\n"
                f"**Actionable Health Guidance:**\n{guidance}\n\n"
                f"*(Note: Classification produced by trained Scikit-learn model. Grounded in actual tool execution).* "
            )
            return resp, tools_executed

        # 2. Intent: Pollutant Analysis / Dominant pollutant
        if any(k in msg_lower for k in ["highest", "dominant", "driver", "which pollutant", "pollutant analysis", "rank"]):
            defaults = {"PM2.5": 30.0, "PM10": 50.0, "NO2": 20.0, "CO": 0.5, "SO2": 10.0, "O3": 30.0}
            if latest_pollutants:
                defaults.update(latest_pollutants)
            extracted = cls._extract_pollutant_values(user_message, defaults)

            p_out, p_ms, p_ok, p_err = execute_tool("analyze_pollutants", {
                "pm25": extracted["PM2.5"],
                "pm10": extracted["PM10"],
                "no2": extracted["NO2"],
                "co": extracted["CO"],
                "so2": extracted["SO2"],
                "o3": extracted["O3"],
            })
            tools_executed.append({
                "tool_name": "analyze_pollutants",
                "tool_arguments": extracted,
                "output": p_out,
                "execution_time_ms": p_ms,
                "success": p_ok,
                "error": p_err,
            })

            resp = (
                f"### 🔬 Multi-Pollutant Benchmark Analysis\n\n"
                f"{p_out.get('summary_text', '')}\n\n"
                f"**Dominant Parameter:** **{p_out.get('dominant_pollutant')}** "
                f"({p_out.get('highest_benchmark_ratio')}x standard threshold)\n\n"
                f"**Ranked Pollutants (Normalized to Exposure Standards):**\n"
            )
            for m in p_out.get("metrics", []):
                resp += f"- **{m['pollutant']}:** {m['value']} {m['unit']} ({m['benchmark_ratio']}x benchmark) — *{m['status']}*\n"
            
            resp += f"\n*{p_out.get('scientific_context', '')}*"
            return resp, tools_executed

        # 3. Intent: Trend Analysis
        if any(k in msg_lower for k in ["trend", "change over time", "time series", "history", "trajectory"]):
            if not active_dataset_id:
                return (
                    "To analyze historical pollutant trends, please upload or select an active dataset containing chronological timestamp records in the **Dataset Explorer** tab.",
                    []
                )
            
            # Infer pollutant
            target_pollutant = "PM2.5"
            for p in ["PM10", "NO2", "CO", "SO2", "O3", "PM2.5"]:
                if p.lower() in msg_lower:
                    target_pollutant = p
                    break

            t_out, t_ms, t_ok, t_err = execute_tool("analyze_trends", {
                "dataset_id": active_dataset_id,
                "pollutant": target_pollutant,
            })
            tools_executed.append({
                "tool_name": "analyze_trends",
                "tool_arguments": {"dataset_id": active_dataset_id, "pollutant": target_pollutant},
                "output": t_out,
                "execution_time_ms": t_ms,
                "success": t_ok,
                "error": t_err,
            })

            if not t_ok:
                return f"Trend analysis could not be completed: {t_err}", tools_executed

            resp = (
                f"### 📈 Time-Series Trend Analysis: {t_out['pollutant']}\n\n"
                f"- **Trajectory Direction:** **{t_out['trend_direction']}** (Slope: {t_out['slope']})\n"
                f"- **Net Percentage Change:** **{t_out['change_percentage']}%**\n"
                f"- **Baseline vs Recent:** Began at {t_out['initial_value']}, concluding at {t_out['final_value']}\n"
                f"- **Observed Range:** Min {t_out['min_value']}, Max {t_out['max_value']}, Mean {t_out['mean_value']}\n\n"
                f"*{t_out['coverage_note']}*"
            )
            return resp, tools_executed

        # 4. Intent: Anomaly Detection
        if any(k in msg_lower for k in ["anomaly", "anomalies", "outlier", "unusual", "spikes"]):
            if not active_dataset_id:
                return (
                    "To scan for environmental anomalies and statistical outliers, please select an active dataset in the **Dataset Explorer**.",
                    []
                )
            
            target_pollutant = "PM2.5"
            for p in ["PM10", "NO2", "CO", "SO2", "O3", "PM2.5"]:
                if p.lower() in msg_lower:
                    target_pollutant = p
                    break

            a_out, a_ms, a_ok, a_err = execute_tool("detect_anomalies", {
                "dataset_id": active_dataset_id,
                "pollutant": target_pollutant,
            })
            tools_executed.append({
                "tool_name": "detect_anomalies",
                "tool_arguments": {"dataset_id": active_dataset_id, "pollutant": target_pollutant},
                "output": a_out,
                "execution_time_ms": a_ms,
                "success": a_ok,
                "error": a_err,
            })

            if not a_ok:
                return f"Anomaly detection error: {a_err}", tools_executed

            resp = (
                f"### ⚠️ Statistical Anomaly Detection: {a_out['pollutant']}\n\n"
                f"- **Examined Records:** {a_out['total_records_examined']}\n"
                f"- **Anomalies Identified:** **{a_out['anomaly_count']}** ({a_out['anomaly_percentage']}% of records)\n"
                f"- **Valid Statistical Boundary:** [{a_out['lower_bound']} to {a_out['upper_bound']}]\n\n"
            )
            if a_out["anomalies"]:
                resp += "**Sample Outlier Instances:**\n"
                for anom in a_out["anomalies"][:5]:
                    resp += f"- Row #{anom['row_index']} ({anom.get('timestamp') or 'No timestamp'}): **{anom['value']}** — *{anom['explanation']}*\n"
            else:
                resp += "No statistical outliers detected within the specified distribution thresholds.\n"

            resp += f"\n*{a_out['interpretation_note']}*"
            return resp, tools_executed

        # 5. Intent: Dataset Analysis
        if any(k in msg_lower for k in ["dataset", "records", "data quality", "upload", "missing values"]):
            if not active_dataset_id:
                return (
                    "No active dataset is currently selected. Please upload a CSV or Excel file in the **Dataset Explorer** to enable automated dataset quality auditing.",
                    []
                )

            d_out, d_ms, d_ok, d_err = execute_tool("analyze_dataset", {"dataset_id": active_dataset_id})
            tools_executed.append({
                "tool_name": "analyze_dataset",
                "tool_arguments": {"dataset_id": active_dataset_id},
                "output": d_out,
                "execution_time_ms": d_ms,
                "success": d_ok,
                "error": d_err,
            })

            if not d_ok:
                return f"Dataset analysis error: {d_err}", tools_executed

            resp = (
                f"### 📊 Dataset Quality & Schema Audit\n\n"
                f"**File:** {d_out['filename']} ({d_out['total_records']} rows, {d_out['total_columns']} columns)\n\n"
                f"- **Quality Health Index:** **{d_out['data_quality_score']}/100**\n"
                f"- **Pollutants Detected:** {', '.join(d_out['pollutant_columns_identified']) or 'None'}\n"
                f"- **Timestamp Available:** {'Yes' if d_out['timestamp_available'] else 'No'}\n"
                f"- **Missing Value Count:** {d_out['missing_values_count']}\n"
                f"- **Duplicate Rows:** {d_out['duplicate_rows_count']}\n\n"
            )
            if d_out["quality_warnings"]:
                resp += "**Data Quality Warnings:**\n"
                for w in d_out["quality_warnings"]:
                    resp += f"- ⚠️ {w}\n"

            return resp, tools_executed

        # 6. Intent: Report Generation
        if any(k in msg_lower for k in ["report", "pdf", "generate report", "download report", "export"]):
            r_out, r_ms, r_ok, r_err = execute_tool("generate_report", {
                "report_type": "pdf",
                "title": "GreenAir Executive Environmental Assessment",
                "dataset_id": active_dataset_id,
            })
            tools_executed.append({
                "tool_name": "generate_report",
                "tool_arguments": {"dataset_id": active_dataset_id, "report_type": "pdf"},
                "output": r_out,
                "execution_time_ms": r_ms,
                "success": r_ok,
                "error": r_err,
            })

            if not r_ok:
                return f"Report generation failed: {r_err}", tools_executed

            resp = (
                f"### 📄 Environmental Intelligence Report Generated\n\n"
                f"- **Document Title:** {r_out['title']}\n"
                f"- **File Size:** {r_out['size_bytes'] / 1024:.1f} KB\n"
                f"- **Generated At:** {r_out['generated_at']}\n"
                f"- **Download Reference:** [{r_out['filename']}]({r_out['download_url']})\n\n"
                f"You can download this document directly or review it in the **Reports** section."
            )
            return resp, tools_executed

        # 7. Intent: Health Guidance
        if any(k in msg_lower for k in ["health", "advice", "safe to go out", "mask", "asthma", "precaution"]):
            h_out, h_ms, h_ok, h_err = execute_tool("get_health_guidance", {"category": "Moderate"})
            tools_executed.append({
                "tool_name": "get_health_guidance",
                "tool_arguments": {"category": "Moderate"},
                "output": h_out,
                "execution_time_ms": h_ms,
                "success": h_ok,
                "error": h_err,
            })

            resp = (
                f"### 🛡️ Environmental Health Guidance\n\n"
                f"- **General Advisory:** {h_out['general_guidance']}\n"
                f"- **Vulnerable Populations:** {h_out['vulnerable_populations']}\n"
                f"- **Outdoor Activities:** {h_out['outdoor_activities']}\n"
                f"- **Indoor Measures:** {h_out['indoor_precautions']}\n\n"
                f"*{h_out['disclaimer']}*"
            )
            return resp, tools_executed

        # General conversational fallback
        return (
            "I am the **GreenAir AI Agent**, your India-wide environmental air quality intelligence assistant. You can ask me to:\n\n"
            "1. **Live Indian City Air Quality**: Inquire about any Indian city (e.g., *'What is the air quality in Chennai right now?'* or *'How is Delhi today?'*).\n"
            "2. **Side-by-Side City Comparison**: Compare two locations (e.g., *'Compare air quality between Delhi and Mumbai'*).\n"
            "3. **TNPCB Industrial Emissions**: Check point-source stack emissions in Tamil Nadu (e.g., *'Show industrial emissions in Hosur or Coimbatore'*).\n"
            "4. **Predict Air Quality**: Enter pollutant concentrations (e.g., *'Predict category for PM2.5: 45, PM10: 80, NO2: 25, CO: 0.8, SO2: 12, O3: 35'*).\n"
            "5. **Analyze Pollutant Ratios**: Compare multi-pollutant levels against health benchmarks.\n"
            "6. **Audit Uploaded Data**: Inspect missing values and distributions in your dataset.\n"
            "7. **Evaluate Trends & Anomalies**: Detect spikes and calculate time-series trajectory.\n"
            "8. **Generate Reports**: Create downloadable PDF / CSV environmental summaries.",
            []
        )

    @classmethod
    def _extract_pollutant_values(cls, text: str, defaults: Dict[str, float]) -> Dict[str, float]:
        """Extract numeric values for pollutants from natural language text using regex."""
        result = defaults.copy()
        patterns = {
            "PM2.5": [r"pm2\.?5\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", r"pm_?25\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
            "PM10": [r"pm10\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", r"pm_?10\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
            "NO2": [r"no2\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
            "CO": [r"co\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
            "SO2": [r"so2\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
            "O3": [r"o3\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)", r"ozone\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)"],
        }

        for canonical, regex_list in patterns.items():
            for rgx in regex_list:
                m = re.search(rgx, text, re.IGNORECASE)
                if m:
                    try:
                        result[canonical] = float(m.group(1))
                        break
                    except ValueError:
                        pass

        return result

llm_service = LLMService()
