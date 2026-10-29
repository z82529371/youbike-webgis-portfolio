import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { MaplibreDeckMap } from "./components/MaplibreDeckMap.jsx";
import { ControlDock } from "./components/ControlDock.jsx";
import { MapTooltip } from "./components/MapTooltip.jsx";
import { fetchLiveStations } from "./services/api.js";
import { filterStations } from "./utils/dataTransform.js";
import { buildDeckLayers } from "./utils/layerBuilder.js";
import { INITIAL_VIEW_STATE } from "./utils/constants.js";

export function App() {
  const [allStations, setAllStations] = useState([]);
  const [flows, setFlows] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);

  // 圖層開關狀態 (含動態軌跡 Trips)
  const [visibility, setVisibility] = useState({
    scatterplot: true,
    hexagon: true,
    arc: true,
    trips: true,
  });

  // ⚡ GPU 數據過濾閾值 (可借車輛門檻)
  const [minAvailableBikes, setMinAvailableBikes] = useState(0);

  // ⏱️ 時間軸控制器狀態 (0 ~ 1440 分鐘，預設早高峰 08:00 = 480 分鐘)
  const [currentTime, setCurrentTime] = useState(480);
  const [isPlaying, setIsPlaying] = useState(true);

  // 底圖主題 (暗黑 / 明亮)
  const [basemapTheme, setBasemapTheme] = useState("dark");

  // 空間與狀態篩選
  const [filterCriteria, setFilterCriteria] = useState({
    district: "全部行政區",
    status: "all",
  });

  // 點選的站點
  const [selectedStation, setSelectedStation] = useState(null);

  // MapLibre 地圖實例參照
  const mapInstanceRef = useRef(null);

  // 載入即時站點資料
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchLiveStations();
      setAllStations(result.stations);
      setFlows(result.flows);
      setTrips(result.trips || []);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.error("資料載入異常:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 動態時空軌跡 (TripsLayer) WebGL Shader 時間推進迴圈
  useEffect(() => {
    if (!isPlaying || !visibility.trips) return;

    let animFrameId;
    const loop = () => {
      setCurrentTime((prev) => (prev + 0.35) % 1440);
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, visibility.trips]);

  // 依條件篩選過濾站點 (行政區與狀態篩選)
  const filteredStations = useMemo(() => {
    return filterStations(allStations, filterCriteria);
  }, [allStations, filterCriteria]);

  // 核心指標統計數據
  const stats = useMemo(() => {
    const total = filteredStations.length;
    let totalBikes = 0;
    let emptyCount = 0;

    for (const s of filteredStations) {
      totalBikes += s.availableBikes;
      if (s.availableBikes === 0) {
        emptyCount += 1;
      }
    }

    return {
      total,
      totalBikes,
      emptyCount,
      lastUpdated,
    };
  }, [filteredStations, lastUpdated]);

  // 切換圖層開關
  const handleToggleLayer = useCallback((layerKey) => {
    setVisibility((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  }, []);

  // 點擊站點
  const handleStationClick = useCallback((station) => {
    setSelectedStation(station);
    if (mapInstanceRef.current && station.coordinates) {
      mapInstanceRef.current.flyTo({
        center: station.coordinates,
        zoom: 15,
        duration: 1000,
      });
    }
  }, []);

  // 行政區選擇處理 (同時聯動 MapLibre 向量圖層與 fitBounds)
  const handleDistrictSelect = useCallback((districtName) => {
    setFilterCriteria((prev) => ({ ...prev, district: districtName }));
  }, []);

  // 視角重設
  const handleResetView = useCallback(() => {
    setFilterCriteria((prev) => ({ ...prev, district: "全部行政區" }));
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        duration: 1200,
      });
    }
  }, []);

  // 構建 deck.gl 圖層陣列 (含 GPU Filter、Trips 與 Interleaved 屬性)
  const layers = useMemo(() => {
    return buildDeckLayers({
      stations: filteredStations,
      flows,
      trips,
      currentTime,
      trailLength: 35,
      minAvailableBikes,
      visibility,
      onStationClick: handleStationClick,
      onHover: setHoverInfo,
    });
  }, [
    filteredStations,
    flows,
    trips,
    currentTime,
    minAvailableBikes,
    visibility,
    handleStationClick,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans antialiased">
      {/* 2D/3D WebGIS 地圖畫布 (MapLibre + deck.gl 交錯渲染管線) */}
      <MaplibreDeckMap
        layers={layers}
        basemapTheme={basemapTheme}
        selectedDistrict={filterCriteria.district}
        onDistrictSelect={handleDistrictSelect}
        mapInstanceRef={mapInstanceRef}
      />

      {/* 浮動式 Tailwind 控制面板 (整合 GPU 過濾滑桿、時間軸控制器) */}
      <ControlDock
        stats={stats}
        visibility={visibility}
        onToggleLayer={handleToggleLayer}
        minAvailableBikes={minAvailableBikes}
        onChangeMinAvailableBikes={setMinAvailableBikes}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        basemapTheme={basemapTheme}
        onToggleBasemap={setBasemapTheme}
        filterCriteria={filterCriteria}
        onFilterChange={setFilterCriteria}
        selectedStation={selectedStation}
        onCloseSelectedStation={() => setSelectedStation(null)}
        onResetView={handleResetView}
        onRefreshData={loadData}
        isLoading={isLoading}
      />

      {/* 純 Tailwind CSS 懸浮提示窗 */}
      <MapTooltip hoverInfo={hoverInfo} />
    </main>
  );
}

export default App;
