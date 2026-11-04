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
import {
  filterStations,
  calculateDistance,
  getDistrictBoundsFromStations,
} from "./utils/dataTransform.js";
import { buildDeckLayers } from "./utils/layerBuilder.js";
import { CITIES, DEFAULT_CITY } from "./utils/constants.js";
import { DISTRICT_BOUNDS } from "./utils/taipeiDistricts.js";

export function App() {
  // 當前選定都會 (預設高雄市，面試高雄主場)
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);

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

  // 載入指定都會即時站點資料
  const loadData = useCallback(
    async (cityKey = currentCity, showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        const result = await fetchLiveStations(cityKey);
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
    },
    [currentCity]
  );

  // 初始載入（預設加載高雄）
  useEffect(() => {
    loadData(currentCity, true);
  }, [loadData, currentCity]);

  // 背景 60 秒自動靜默輪詢與倒數計時
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadData(currentCity, false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadData, currentCity]);

  // 雙城無縫切換（高雄 ⇄ 台北）
  const handleCityChange = useCallback(
    (newCityKey) => {
      if (newCityKey === currentCity) return;
      setCurrentCity(newCityKey);
      setSelectedDistrict("全部行政區");
      setSelectedStation(null);
      setRefreshCountdown(60);

      const cityConf = CITIES[newCityKey] || CITIES.kaohsiung;
      if (mapInstanceRef.current && cityConf.viewState) {
        mapInstanceRef.current.flyTo({
          center: [cityConf.viewState.longitude, cityConf.viewState.latitude],
          zoom: cityConf.viewState.zoom,
          pitch: cityConf.viewState.pitch,
          bearing: cityConf.viewState.bearing,
          duration: 2000,
        });
      }

      loadData(newCityKey, true);
    },
    [currentCity, loadData]
  );

  // 手動強制更新
  const handleManualRefresh = useCallback(() => {
    setRefreshCountdown(60);
    loadData(currentCity, true);
  }, [loadData, currentCity]);

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

  // 切換行政區並動態計算外包矩形平滑縮放
  const handleDistrictSelect = useCallback(
    (district) => {
      setSelectedDistrict(district);
      const map = mapInstanceRef.current;
      if (!map) return;

      const cityConf = CITIES[currentCity] || CITIES.kaohsiung;

      if (district === "全部行政區" || district === "all") {
        map.flyTo({
          center: [cityConf.viewState.longitude, cityConf.viewState.latitude],
          zoom: cityConf.viewState.zoom,
          pitch: cityConf.viewState.pitch,
          bearing: cityConf.viewState.bearing,
          duration: 1200,
        });
        return;
      }

      // 優先使用動態站點外包矩形，若為台北且有靜態邊界亦可使用
      const bounds =
        getDistrictBoundsFromStations(allStations, district) ||
        DISTRICT_BOUNDS[district];
      if (bounds) {
        map.fitBounds(bounds, {
          padding: 50,
          pitch: 35,
          duration: 1200,
        });
      }
    },
    [currentCity, allStations]
  );

  // 重設當前都會中心視角
  const handleResetView = useCallback(() => {
    setSelectedDistrict("全部行政區");
    setSelectedStation(null);
    const cityConf = CITIES[currentCity] || CITIES.kaohsiung;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [cityConf.viewState.longitude, cityConf.viewState.latitude],
        zoom: cityConf.viewState.zoom,
        pitch: cityConf.viewState.pitch,
        bearing: cityConf.viewState.bearing,
        duration: 1200,
      });
    }
  }, [currentCity]);

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

        // 自動找出周邊最近且符合借/還需求的站點
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

  const currentCityConfig = CITIES[currentCity] || CITIES.kaohsiung;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 頂部生活出行膠囊導航 (雙城切換 + 我要借車 / 我要還車 + 站點搜尋 + 定位) */}
      <CommuterNavbar
        currentCity={currentCity}
        onCityChange={handleCityChange}
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

      {/* 4. 底部即時車況卡 + 2.0E 電輔車亮點 + 智能救援備援站 */}
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
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold tracking-wide">
            正在連線 {currentCityConfig.name} YouBike 2.0 即時開放資料...
          </p>
          <span className="text-xs text-slate-400 mt-1 font-mono">
            {currentCityConfig.name} Open Data Real-Time Ingestion
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
