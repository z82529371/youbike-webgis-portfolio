import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MaplibreDeckMap } from './components/MaplibreDeckMap.jsx';
import { ControlDock } from './components/ControlDock.jsx';
import { MapTooltip } from './components/MapTooltip.jsx';
import { fetchLiveStations } from './services/api.js';
import { filterStations } from './utils/dataTransform.js';
import { buildDeckLayers } from './utils/layerBuilder.js';
import { INITIAL_VIEW_STATE } from './utils/constants.js';

export function App() {
  const [allStations, setAllStations] = useState([]);
  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [hoverInfo, setHoverInfo] = useState(null);
  
  // 圖層開關狀態
  const [visibility, setVisibility] = useState({
    scatterplot: true,
    hexagon: true,
    arc: true
  });

  // 底圖主題 (暗黑 / 明亮)
  const [basemapTheme, setBasemapTheme] = useState('dark');

  // 空間與狀態篩選
  const [filterCriteria, setFilterCriteria] = useState({
    district: 'all',
    status: 'all'
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
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.error('資料載入異常:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 依條件篩選過濾站點
  const filteredStations = useMemo(() => {
    return filterStations(allStations, filterCriteria);
  }, [allStations, filterCriteria]);

  // 統計數據
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
      lastUpdated
    };
  }, [filteredStations, lastUpdated]);

  // 切換圖層開關
  const handleToggleLayer = useCallback((layerKey) => {
    setVisibility(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  }, []);

  // 點擊站點
  const handleStationClick = useCallback((station) => {
    setSelectedStation(station);
    if (mapInstanceRef.current && station.coordinates) {
      mapInstanceRef.current.flyTo({
        center: station.coordinates,
        zoom: 15,
        duration: 1000
      });
    }
  }, []);

  // 視角重設
  const handleResetView = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        duration: 1200
      });
    }
  }, []);

  // 構建 deck.gl 圖層陣列
  const layers = useMemo(() => {
    return buildDeckLayers({
      stations: filteredStations,
      flows,
      visibility,
      onStationClick: handleStationClick,
      onHover: setHoverInfo
    });
  }, [filteredStations, flows, visibility, handleStationClick]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans antialiased">
      {/* 2D/3D WebGIS 地圖畫布 */}
      <MaplibreDeckMap
        layers={layers}
        basemapTheme={basemapTheme}
        mapInstanceRef={mapInstanceRef}
      />

      {/* 浮動式 Tailwind 控制面板 */}
      <ControlDock
        stats={stats}
        visibility={visibility}
        onToggleLayer={handleToggleLayer}
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
