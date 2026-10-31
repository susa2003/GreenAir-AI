export interface PollutantValues {
  [key: string]: number;
  "PM2.5": number;
  PM10: number;
  NO2: number;
  CO: number;
  SO2: number;
  O3: number;
}

export interface PredictionResult {
  id?: string;
  category: "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe" | string;
  probabilities: Record<string, number>;
  confidence_pct: number;
  input_values: Record<string, number>;
  model_name: string;
  model_type: string;
  is_fallback: boolean;
  disclaimer: string;
  health_guidance: string;
  status_color: string;
  created_at?: string;
}

export interface PollutantMetric {
  pollutant: string;
  value: number;
  unit: string;
  standard_benchmark: number;
  benchmark_ratio: number;
  benchmark_source: string;
  status: string;
  description: string;
}

export interface PollutantAnalysisResult {
  dominant_pollutant: string;
  highest_relative_pollutant: string;
  highest_benchmark_ratio: number;
  metrics: PollutantMetric[];
  attention_flags: string[];
  summary_text: string;
  scientific_context: string;
}

export interface DatasetItem {
  id: string;
  filename: string;
  stored_path: string;
  row_count: number;
  column_count: number;
  columns: string[];
  pollutant_columns: string[];
  has_timestamps: boolean;
  timestamp_column?: string;
  date_start?: string;
  date_end?: string;
  missing_values_count: number;
  duplicate_rows_count: number;
  data_quality_score: number;
  quality_warnings: string[];
  pollutant_stats: Record<string, Record<string, number>>;
  preview_rows: Record<string, any>[];
  created_at: string;
  source_type?: "cpcb_ground" | "open_meteo_model" | "synthetic_demo" | "upload" | string;
  source_description?: string;
  is_synthetic?: boolean;
  is_time_series?: boolean;
}

export interface TrendPoint {
  timestamp: string;
  value: number;
  rolling_avg?: number;
}

export interface TrendResult {
  pollutant: string;
  trend_direction: "Increasing" | "Decreasing" | "Stable" | "Inconclusive";
  slope: number;
  change_percentage: number;
  initial_value: number;
  final_value: number;
  min_value: number;
  max_value: number;
  mean_value: number;
  point_count: number;
  coverage_note: string;
  data_points: TrendPoint[];
}

export interface AnomalyRecord {
  row_index: number;
  timestamp?: string;
  pollutant: string;
  value: number;
  threshold_low: number;
  threshold_high: number;
  score: number;
  severity: "Low" | "Moderate" | "High";
  explanation: string;
}

export interface AnomalyResult {
  dataset_id: string;
  pollutant: string;
  method: string;
  total_records_examined: number;
  anomaly_count: number;
  anomaly_percentage: number;
  lower_bound: number;
  upper_bound: number;
  anomalies: AnomalyRecord[];
  interpretation_note: string;
}

export interface ReportItem {
  report_id: string;
  filename: string;
  file_type: "pdf" | "csv";
  size_bytes: number;
  download_url: string;
  title: string;
  generated_at: string;
  summary_findings: string[];
}

export interface ToolExecutionRecord {
  tool_name: string;
  tool_arguments: Record<string, any>;
  output: any;
  execution_time_ms: number;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: ToolExecutionRecord[];
  created_at?: string;
}

export interface ChatSession {
  session_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  database: {
    status: string;
    type: string;
  };
  model: {
    loaded: boolean;
    type: string;
    is_fallback: boolean;
    classes: string[];
  };
  ai_engine: {
    provider_available: boolean;
    active_provider: string;
  };
}

export interface LocationItem {
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  country: string;
  country_code: string;
}

export interface OpenMeteoReading {
  time: string;
  pm10: number;
  pm2_5: number;
  carbon_monoxide: number;
  carbon_monoxide_mgm3: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
  european_aqi?: number;
  us_aqi?: number;
  source_attribution: string;
  data_type: string;
}

export interface HourlyForecastPoint {
  time: string;
  pm2_5: number;
  pm10: number;
  no2: number;
  co_mgm3: number;
  so2: number;
  o3: number;
  european_aqi?: number;
}

export interface IndustryEmissionParameter {
  name: string;
  current?: number | null;
  unit: string;
  min?: number | null;
  max?: number | null;
}

export interface IndustryRecord {
  id: number;
  name: string;
  city: string;
  address?: string;
  industry_type?: string;
  emmision_type?: string;
  industry_category?: string;
  latitude?: number | null;
  longitude?: number | null;
  spcb_regional_office?: string;
  parameters: IndustryEmissionParameter[];
  last_update_date?: string;
  data_type: string;
  source: string;
}

export interface CityAirQualityResponse {
  location: LocationItem;
  sources_available: string[];
  open_meteo?: OpenMeteoReading;
  ml_classification?: PredictionResult;
  hourly_forecast: HourlyForecastPoint[];
  data_gov_in?: any;
  tnpcb_industries: IndustryRecord[];
  retrieved_at: string;
  source_disclaimers: Record<string, string>;
}

export interface CityComparisonResponse {
  city_1: string;
  city_2: string;
  location_1: LocationItem;
  location_2: LocationItem;
  reading_1?: OpenMeteoReading;
  reading_2?: OpenMeteoReading;
  ml_class_1?: string;
  ml_class_2?: string;
  comparison_metrics: Record<string, { [key: string]: any; unit: string; diff: number; pct_change: number }>;
  key_differences: string[];
  limitations: string;
}

export interface DataGovStatus {
  status: string;
  configured: boolean;
  is_active: boolean;
  missing_configuration?: string[];
  message: string;
  configured_resource_id?: string | null;
}
