import React, { createContext, useContext, useState, useEffect } from "react";
import {
  DatasetItem,
  PollutantValues,
  PredictionResult,
  SystemHealth,
  CityAirQualityResponse,
  DataGovStatus,
} from "../types";
import { api } from "../api";

export interface PollutantSourceMeta {
  type: "city_model" | "cpcb_station" | "manual" | "default";
  label: string;
  stationName?: string;
}

interface AppContextType {
  activePage: string;
  setActivePage: (page: string) => void;
  activeDataset: DatasetItem | null;
  setActiveDataset: (dataset: DatasetItem | null) => void;
  selectDataset: (dataset: DatasetItem | null) => void;
  datasets: DatasetItem[];
  loadDatasets: () => Promise<void>;
  pollutantInputs: PollutantValues;
  setPollutantInputs: React.Dispatch<React.SetStateAction<PollutantValues>>;
  pollutantSource: PollutantSourceMeta;
  setPollutantSource: (source: PollutantSourceMeta) => void;
  latestPrediction: PredictionResult | null;
  setLatestPrediction: (pred: PredictionResult | null) => void;
  systemHealth: SystemHealth | null;
  refreshHealth: () => Promise<void>;
  isLoading: boolean;
  loadSyntheticDemo: () => Promise<void>;

  // India-Wide Location Intelligence State
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  liveCityData: CityAirQualityResponse | null;
  loadCityAirQuality: (city: string, forceRefresh?: boolean) => Promise<void>;
  isCityLoading: boolean;
  applyCityToInputs: () => void;
  applyStationToInputs: (station: any) => void;
  dataGovStatus: DataGovStatus | null;
  refreshDataGovStatus: () => Promise<void>;

  // Dataset Import Helpers
  importCpcbForCity: (city: string) => Promise<DatasetItem>;
  importOpenMeteoForCity: (city: string, lat?: number, lon?: number) => Promise<DatasetItem>;
}

const DEFAULT_POLLUTANTS: PollutantValues = {
  "PM2.5": 30.0,
  PM10: 50.0,
  NO2: 20.0,
  CO: 0.5,
  SO2: 10.0,
  O3: 30.0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [activeDataset, setActiveDataset] = useState<DatasetItem | null>(null);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [pollutantInputs, setPollutantInputs] = useState<PollutantValues>(DEFAULT_POLLUTANTS);
  const [pollutantSource, setPollutantSource] = useState<PollutantSourceMeta>({
    type: "default",
    label: "Baseline Parameters",
  });
  const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // India-Wide Location Intelligence State
  const [selectedCity, setSelectedCity] = useState<string>("Chennai");
  const [liveCityData, setLiveCityData] = useState<CityAirQualityResponse | null>(null);
  const [isCityLoading, setIsCityLoading] = useState<boolean>(false);
  const [dataGovStatus, setDataGovStatus] = useState<DataGovStatus | null>(null);

  const refreshDataGovStatus = async () => {
    try {
      const status = await api.getDataGovStatus();
      setDataGovStatus(status);
    } catch (e) {
      console.warn("Could not fetch data.gov.in status:", e);
    }
  };

  const loadCityAirQuality = async (cityName: string, forceRefresh: boolean = false) => {
    if (!cityName || !cityName.trim()) return;
    setIsCityLoading(true);
    try {
      const data = await api.getCityAirQuality(cityName.trim(), forceRefresh);
      setLiveCityData(data);
      setSelectedCity(data.location.name);

      if (data.ml_classification) {
        setLatestPrediction(data.ml_classification);
      }

      // Automatically sync dashboard pollutant inputs from live city atmospheric readings
      if (data.open_meteo) {
        const om = data.open_meteo;
        setPollutantInputs({
          "PM2.5": om.pm2_5,
          PM10: om.pm10,
          NO2: om.nitrogen_dioxide,
          CO: om.carbon_monoxide_mgm3,
          SO2: om.sulphur_dioxide,
          O3: om.ozone,
        });
        setPollutantSource({
          type: "city_model",
          label: `Live Atmospheric Model (${data.location.name})`,
        });
      }
    } catch (err) {
      console.error(`Error loading air quality for ${cityName}:`, err);
    } finally {
      setIsCityLoading(false);
    }
  };

  const applyCityToInputs = () => {
    if (!liveCityData || !liveCityData.open_meteo) return;
    const om = liveCityData.open_meteo;
    setPollutantInputs({
      "PM2.5": om.pm2_5,
      PM10: om.pm10,
      NO2: om.nitrogen_dioxide,
      CO: om.carbon_monoxide_mgm3,
      SO2: om.sulphur_dioxide,
      O3: om.ozone,
    });
    setPollutantSource({
      type: "city_model",
      label: `Live Model: ${liveCityData.location.name}`,
    });
  };

  const applyStationToInputs = (station: any) => {
    if (!station || !station.pollutants) return;
    const p = station.pollutants;
    const getVal = (key: string, fallback: number) => {
      if (p[key] && p[key].avg !== null && p[key].avg !== undefined) {
        return Number(p[key].avg);
      }
      return fallback;
    };

    setPollutantInputs({
      "PM2.5": getVal("PM2.5", pollutantInputs["PM2.5"]),
      PM10: getVal("PM10", pollutantInputs.PM10),
      NO2: getVal("NO2", pollutantInputs.NO2),
      CO: getVal("CO", pollutantInputs.CO),
      SO2: getVal("SO2", pollutantInputs.SO2),
      O3: getVal("OZONE", getVal("O3", pollutantInputs.O3)),
    });
    setPollutantSource({
      type: "cpcb_station",
      label: `CPCB Ground Station: ${station.station_name || "Station"}`,
      stationName: station.station_name,
    });
  };

  const selectDataset = (ds: DatasetItem | null) => {
    setActiveDataset(ds);
    if (ds) {
      try {
        localStorage.setItem("greenair_active_dataset_id", ds.id);
      } catch {}
    } else {
      try {
        localStorage.removeItem("greenair_active_dataset_id");
      } catch {}
    }
  };

  const refreshHealth = async () => {
    try {
      const health = await api.getHealth();
      setSystemHealth(health);
    } catch (e) {
      console.warn("Could not fetch system health:", e);
    }
  };

  const loadDatasets = async () => {
    try {
      const list = await api.getDatasets();
      setDatasets(list);

      // Check saved selection
      const savedId = localStorage.getItem("greenair_active_dataset_id");
      if (savedId) {
        const found = list.find((d) => d.id === savedId);
        if (found) {
          setActiveDataset(found);
          return;
        }
      }

      // If no saved selection, prefer a real imported dataset over synthetic demo
      if (list.length > 0 && !activeDataset) {
        const realDataset = list.find((d) => !d.filename.toLowerCase().includes("synthetic"));
        const target = realDataset || list[0];
        setActiveDataset(target);
      }
    } catch (e) {
      console.warn("Could not fetch datasets:", e);
    }
  };

  const importCpcbForCity = async (city: string): Promise<DatasetItem> => {
    setIsLoading(true);
    try {
      const ds = await api.importCpcbDataset(city);
      await loadDatasets();
      selectDataset(ds);
      return ds;
    } finally {
      setIsLoading(false);
    }
  };

  const importOpenMeteoForCity = async (city: string, lat?: number, lon?: number): Promise<DatasetItem> => {
    setIsLoading(true);
    try {
      const ds = await api.importOpenMeteoDataset(city, lat, lon);
      await loadDatasets();
      selectDataset(ds);
      return ds;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyntheticDemo = async () => {
    setIsLoading(true);
    try {
      const demoCsv = `timestamp,PM2.5,PM10,NO2,CO,SO2,O3,location,source
2026-10-01 08:00:00,28.4,48.2,18.5,0.45,8.2,26.1,Station-Alpha,SYNTHETIC
2026-10-02 08:00:00,31.2,52.1,20.1,0.50,9.1,29.4,Station-Alpha,SYNTHETIC
2026-10-03 08:00:00,34.0,55.4,22.8,0.55,10.4,32.0,Station-Alpha,SYNTHETIC
2026-10-04 08:00:00,38.5,61.0,26.0,0.62,12.0,35.8,Station-Alpha,SYNTHETIC
2026-10-05 08:00:00,43.0,69.5,30.2,0.75,13.8,39.2,Station-Alpha,SYNTHETIC
2026-10-06 08:00:00,48.1,76.4,34.8,0.85,15.2,43.0,Station-Alpha,SYNTHETIC
2026-10-07 08:00:00,54.2,85.0,39.0,0.96,17.5,47.8,Station-Alpha,SYNTHETIC
2026-10-08 08:00:00,175.0,255.0,92.0,3.20,65.0,118.0,Station-Alpha,SYNTHETIC
2026-10-09 08:00:00,62.5,98.2,46.0,1.10,20.5,54.0,Station-Alpha,SYNTHETIC
2026-10-10 08:00:00,55.0,88.0,41.2,0.98,18.0,49.5,Station-Alpha,SYNTHETIC
2026-10-11 08:00:00,47.8,75.3,35.0,0.84,15.0,42.5,Station-Alpha,SYNTHETIC
2026-10-12 08:00:00,41.2,65.0,29.4,0.71,13.0,37.0,Station-Alpha,SYNTHETIC
2026-10-13 08:00:00,35.0,56.2,23.5,0.58,10.8,32.4,Station-Alpha,SYNTHETIC
2026-10-14 08:00:00,30.5,49.0,19.8,0.49,9.0,28.0,Station-Alpha,SYNTHETIC`;

      const blob = new Blob([demoCsv], { type: "text/csv" });
      const file = new File([blob], "synthetic_air_quality_demo.csv", { type: "text/csv" });
      const ds = await api.uploadDataset(file);
      await loadDatasets();
      selectDataset(ds);
    } catch (err) {
      console.error("Error loading demo dataset:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshHealth();
    loadDatasets();
    refreshDataGovStatus();
    loadCityAirQuality("Chennai");
    // Run initial prediction with defaults
    api.predict(DEFAULT_POLLUTANTS)
      .then((res) => setLatestPrediction(res))
      .catch((e) => console.warn("Initial prediction warning:", e));
  }, []);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        activeDataset,
        setActiveDataset,
        selectDataset,
        datasets,
        loadDatasets,
        pollutantInputs,
        setPollutantInputs,
        pollutantSource,
        setPollutantSource,
        latestPrediction,
        setLatestPrediction,
        systemHealth,
        refreshHealth,
        isLoading,
        loadSyntheticDemo,
        selectedCity,
        setSelectedCity,
        liveCityData,
        loadCityAirQuality,
        isCityLoading,
        applyCityToInputs,
        applyStationToInputs,
        dataGovStatus,
        refreshDataGovStatus,
        importCpcbForCity,
        importOpenMeteoForCity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
