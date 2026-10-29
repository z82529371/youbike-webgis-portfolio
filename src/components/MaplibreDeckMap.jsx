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
      layers
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
      className="absolute inset-0 w-screen h-screen z-0"
    />
  );
}
