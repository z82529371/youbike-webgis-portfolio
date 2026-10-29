import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { INITIAL_VIEW_STATE, BASEMAP_STYLES } from '../utils/constants.js';

export function MaplibreDeckMap({
  layers = [],
  basemapTheme = 'dark',
  mapInstanceRef
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  // 初始化 MapLibre 與 deck.gl Overlay
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[basemapTheme],
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      pitch: INITIAL_VIEW_STATE.pitch,
      bearing: INITIAL_VIEW_STATE.bearing,
      antialias: true
    });

    // 建立 deck.gl WebGL 疊加層控制器 (MapboxOverlay)
    const overlay = new MapboxOverlay({
      interleaved: false,
      layers,
      getTooltip: ({ object, layer }) => {
        if (!object) return null;

        // 1. 即時站點 Tooltip
        if (layer?.id === 'layer-stations-scatterplot') {
          const bikeColor = object.availableBikes === 0 ? '#ef4444' : object.availableBikes < 3 ? '#f59e0b' : '#10b981';
          return {
            html: `
              <div style="font-family: system-ui, sans-serif; padding: 8px 12px; font-size: 13px; line-height: 1.5; color: #f8fafc; background: rgba(15, 23, 42, 0.95); border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); pointer-events: none;">
                <div style="font-weight: 700; margin-bottom: 4px; color: #38bdf8; font-size: 14px;">🚲 ${object.name}</div>
                <div style="display: flex; gap: 8px; margin-bottom: 2px;">
                  <span style="color: #94a3b8;">行政區:</span>
                  <span style="font-weight: 600;">${object.district}</span>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 2px;">
                  <span style="color: #94a3b8;">可借車輛:</span>
                  <span style="font-weight: 700; color: ${bikeColor};">${object.availableBikes} 輛</span>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 2px;">
                  <span style="color: #94a3b8;">可還空位:</span>
                  <span style="font-weight: 600;">${object.emptySpaces} 格</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                  更新時間: ${object.updateTime}
                </div>
              </div>
            `
          };
        }

        // 2. 3D 蜂巢聚合 Tooltip
        if (layer?.id === 'layer-density-hexagon') {
          return {
            html: `
              <div style="font-family: system-ui, sans-serif; padding: 8px 12px; font-size: 13px; line-height: 1.5; color: #f8fafc; background: rgba(15, 23, 42, 0.95); border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12);">
                <div style="font-weight: 700; margin-bottom: 4px; color: #fbbf24; font-size: 14px;">🏢 3D 空間蜂巢聚合</div>
                <div>網格涵蓋站點: <b>${object.points?.length || 0}</b> 站</div>
                <div>網格總車輛數: <b>${object.elevationValue || 0}</b> 輛</div>
              </div>
            `
          };
        }

        // 3. 起訖流向 Tooltip
        if (layer?.id === 'layer-od-flows-arc') {
          return {
            html: `
              <div style="font-family: system-ui, sans-serif; padding: 8px 12px; font-size: 13px; line-height: 1.5; color: #f8fafc; background: rgba(15, 23, 42, 0.95); border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12);">
                <div style="font-weight: 700; margin-bottom: 4px; color: #ec4899; font-size: 14px;">✈️ 跨區借還移動流向</div>
                <div>起點: <b>${object.fromName}</b></div>
                <div>迄點: <b>${object.toName}</b></div>
                <div>預估即時流向: <b>${object.tripCount}</b> 旅次/時</div>
              </div>
            `
          };
        }

        return null;
      }
    });

    map.addControl(overlay);

    mapRef.current = map;
    overlayRef.current = overlay;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // 當 deck.gl 圖層配置改變時，同步更新 Overlay
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
    }
  }, [layers]);

  // 切換底圖風格 (Dark / Light)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(BASEMAP_STYLES[basemapTheme]);
    }
  }, [basemapTheme]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0
      }}
    />
  );
}
