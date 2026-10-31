import {
  PollutantValues,
  PredictionResult,
  PollutantAnalysisResult,
  DatasetItem,
  TrendResult,
  AnomalyResult,
  ReportItem,
  SystemHealth,
  ChatSession,
  LocationItem,
  CityAirQualityResponse,
  CityComparisonResponse,
  IndustryRecord,
  DataGovStatus,
} from "./types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => request<SystemHealth>("/health"),

  // Predictions
  predict: (pollutants: PollutantValues) =>
    request<PredictionResult>("/predictions", {
      method: "POST",
      body: JSON.stringify(pollutants),
    }),

  // Multi-pollutant analysis
  analyzePollutants: (pollutants: PollutantValues) =>
    request<PollutantAnalysisResult>("/analysis/pollutants", {
      method: "POST",
      body: JSON.stringify(pollutants),
    }),

  // Datasets
  getDatasets: () => request<DatasetItem[]>("/datasets"),
  getDataset: (id: string) => request<DatasetItem>(`/datasets/${id}`),
  activateDataset: (id: string) =>
    request<DatasetItem>(`/datasets/${id}/activate`, { method: "POST" }),
  importCpcbDataset: (city: string = "Chennai", limit: number = 200) =>
    request<DatasetItem>(`/datasets/import/cpcb?city=${encodeURIComponent(city)}&limit=${limit}`, {
      method: "POST",
    }),
  importOpenMeteoDataset: (city: string = "Chennai", latitude?: number, longitude?: number) =>
    request<DatasetItem>(
      `/datasets/import/open-meteo?city=${encodeURIComponent(city)}${
        latitude !== undefined && longitude !== undefined
          ? `&latitude=${latitude}&longitude=${longitude}`
          : ""
      }`,
      { method: "POST" }
    ),
  uploadDataset: async (file: File): Promise<DatasetItem> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let msg = "Upload failed";
      try {
        const err = await res.json();
        msg = err.detail || msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Trends & Anomalies
  getTrends: (datasetId: string, pollutant: string = "PM2.5", window: number = 3) =>
    request<TrendResult>("/analysis/trends", {
      method: "POST",
      body: JSON.stringify({ dataset_id: datasetId, pollutant, rolling_window: window }),
    }),

  getAnomalies: (datasetId: string, pollutant: string = "PM2.5", method: string = "iqr", threshold: number = 1.5) =>
    request<AnomalyResult>("/analysis/anomalies", {
      method: "POST",
      body: JSON.stringify({ dataset_id: datasetId, pollutant, method, multiplier: threshold }),
    }),

  // Health Guidance
  getGuidance: (category: string, pollutants?: Record<string, number>) =>
    request<any>("/analysis/guidance", {
      method: "POST",
      body: JSON.stringify({ category, pollutants }),
    }),

  // Reports
  generateReport: (payload: { report_type: "pdf" | "csv"; title?: string; dataset_id?: string; prediction_id?: string }) =>
    request<ReportItem>("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getReports: () => request<ReportItem[]>("/reports"),

  // Chat
  sendMessage: (payload: { message: string; session_id?: string; active_dataset_id?: string; latest_pollutants?: Record<string, number> }) =>
    request<{
      session_id: string;
      response: string;
      tools_executed: any[];
      data_references: any;
      provider_used: string;
      finish_reason: string;
      created_at: string;
    }>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSessions: () => request<ChatSession[]>("/chat/sessions"),
  getSessionMessages: (sessionId: string) => request<{ session: any; messages: any[] }>(`/chat/sessions/${sessionId}`),

  // History
  getHistory: (limit: number = 50, type?: string) =>
    request<any[]>(`/history?limit=${limit}${type ? `&record_type=${type}` : ""}`),

  // India-Wide Location Intelligence & Sources
  searchLocations: (query: string) =>
    request<LocationItem[]>(`/locations/search?q=${encodeURIComponent(query)}`),

  getCityAirQuality: (city: string, forceRefresh: boolean = false) =>
    request<CityAirQualityResponse>(`/locations/${encodeURIComponent(city)}/live${forceRefresh ? "?force_refresh=true" : ""}`),

  compareCities: (city1: string, city2: string) =>
    request<CityComparisonResponse>("/locations/compare", {
      method: "POST",
      body: JSON.stringify({ city_1: city1, city_2: city2 }),
    }),

  // TNPCB OCEMS Industrial Monitoring
  getTnpcbCities: () =>
    request<string[]>("/industrial/tnpcb/cities"),

  getTnpcbIndustries: (city?: string, emissionType: string = "air", onlyActive: boolean = false) =>
    request<IndustryRecord[]>(
      `/industrial/tnpcb/industries?${city ? `city=${encodeURIComponent(city)}&` : ""}emission_type=${emissionType}&only_active=${onlyActive}`
    ),

  // data.gov.in Integration
  getDataGovStatus: () =>
    request<DataGovStatus>("/datagov/status"),

  getDataGovRecords: (city: string = "Delhi", limit: number = 20) =>
    request<any>(`/datagov/records?city=${encodeURIComponent(city)}&limit=${limit}`),
};
