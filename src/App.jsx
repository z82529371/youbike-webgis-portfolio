import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { MaplibreDeckMap } from "./components/MaplibreDeckMap.jsx";
import { CommuterNavbar } from "./components/CommuterNavbar.jsx";
import { StationDetailCard } from "./components/StationDetailCard.jsx";
import { MapTooltip } from "./components/MapTooltip.jsx";
import { fetchLiveStations } from "./services/api.js";
import { filterStations, calculateDistance } from "./utils/dataTransform.js";
import { buildDeckLayers } from "./utils/layerBuilder.js";
import { INITIAL_VIEW_STATE } from "./utils/constants.js";
import { DISTRICT_BOUNDS } from "./utils/taipeiDistricts.js";

export function App() {
  const [allStations, setAllStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isLiveSource, setIsLiveSource] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);

  // 市民核心用車意圖 ('borrow': 我要借車 | 'return': 我要還車)
  const [commuterIntent, setCommuterIntent] = useState("borrow");

  // 選取的行政區
  const [selectedDistrict, setSelectedDistrict] = useState("全部行政區");

  // 目前選取的目標站點
  const [selectedStation, setSelectedStation] = useState(null);

  // 市民當前定位 [lon, lat]
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // 底圖主題 (暗黑 / 明亮)
  const [basemapTheme, setBasemapTheme] = useState("dark");

  // 60秒自動輪詢倒數計時器
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  // 地圖實例參照
  const mapInstanceRef = useRef(null);

  // 載入即時站點資料
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await fetchLiveStations();
      setAllStations(result.stations);
      setLastUpdated(result.lastUpdated);
      setIsLiveSource(result.source === "live");

      // 若當前有選取的站點，同步更新其即時車況數據
      setSelectedStation((prev) => {
        if (!prev) return null;
        const updated = result.stations.find((s) => s.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      console.error("資料載入異常:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // 初始載入
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // 背景 60 秒自動靜默輪詢與倒數計時
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadData(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadData]);

  // 手動強制更新
  const handleManualRefresh = useCallback(() => {
    setRefreshCountdown(60);
    loadData(true);
  }, [loadData]);

  // 切換用車意圖
  const handleIntentChange = useCallback((intent) => {
    setCommuterIntent(intent);
  }, []);

  // 選取站點並平滑飛行至該站
  const handleSelectStation = useCallback((station) => {
    setSelectedStation(station);
    if (mapInstanceRef.current && station?.coordinates) {
      mapInstanceRef.current.flyTo({
        center: station.coordinates,
        zoom: 16.5,
        pitch: 35,
        duration: 1200,
      });
    }
  }, []);

  // 切換行政區並縮放至行政區外包矩形
  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(district);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (district === "全部行政區" || district === "all") {
      map.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        duration: 1200,
      });
    } else if (DISTRICT_BOUNDS[district]) {
      map.fitBounds(DISTRICT_BOUNDS[district], {
        padding: 50,
        pitch: 35,
        duration: 1200,
      });
    }
  }, []);

  // 重設台北市中心視角
  const handleResetView = useCallback(() => {
    setSelectedDistrict("全部行政區");
    setSelectedStation(null);
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

  // 定位「我的位置」並推薦周圍最近可用站點
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援定位功能。");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: coords,
            zoom: 16.5,
            pitch: 35,
            duration: 1500,
          });
        }

        // 自動找出距離市民最近且有車/有位的站點
        if (allStations.length > 0) {
          const nearest = [...allStations]
            .map((s) => ({
              ...s,
              dist: calculateDistance(coords, s.coordinates),
            }))
            .filter((s) =>
              commuterIntent === "borrow"
                ? s.availableBikes >= 1
                : s.emptySpaces >= 1
            )
            .sort((a, b) => a.dist - b.dist)[0];

          if (nearest) {
            setSelectedStation(nearest);
          }
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("定位失敗:", err);
        alert("無法取得您的精確定位，請確認已授權位置存取權限。");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [allStations, commuterIntent]);

  // 切換底圖明暗主題
  const handleThemeToggle = useCallback(() => {
    setBasemapTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // 依行政區篩選站點
  const visibleStations = useMemo(() => {
    return filterStations(allStations, { district: selectedDistrict });
  }, [allStations, selectedDistrict]);

  // 動態建立渲染圖層
  const deckLayers = useMemo(() => {
    return buildDeckLayers({
      stations: visibleStations,
      commuterIntent,
      selectedStation,
      userLocation,
      onStationClick: handleSelectStation,
      onHover: setHoverInfo,
    });
  }, [
    visibleStations,
    commuterIntent,
    selectedStation,
    userLocation,
    handleSelectStation,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 頂部生活出行膠囊導航 (我要借車 / 我要還車 + 站點搜尋 + 定位) */}
      <CommuterNavbar
        commuterIntent={commuterIntent}
        onIntentChange={handleIntentChange}
        allStations={allStations}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={handleDistrictSelect}
        onStationSelect={handleSelectStation}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        refreshCountdown={refreshCountdown}
        isLiveSource={isLiveSource}
        basemapTheme={basemapTheme}
        onThemeToggle={handleThemeToggle}
        onResetView={handleResetView}
      />

      {/* 2. 地圖畫布容器 */}
      <MaplibreDeckMap
        layers={deckLayers}
        basemapTheme={basemapTheme}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={handleDistrictSelect}
        mapInstanceRef={mapInstanceRef}
      />

      {/* 3. 游標懸停 Tooltip */}
      <MapTooltip hoverInfo={hoverInfo} commuterIntent={commuterIntent} />

      {/* 4. 底部即時車況卡 + 智能救援備援替代站 (選取站點時浮現) */}
      <StationDetailCard
        station={selectedStation}
        allStations={allStations}
        commuterIntent={commuterIntent}
        onClose={() => setSelectedStation(null)}
        onSelectAlternative={handleSelectStation}
      />

      {/* 首次載入全屏遮罩 */}
      {isLoading && allStations.length === 0 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold tracking-wide">
            正在連線台北市 YouBike 2.0 即時開放資料...
          </p>
          <span className="text-xs text-slate-400 mt-1 font-mono">
            Taipei Open Data Real-Time Ingestion
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
