import React, { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { INITIAL_VIEW_STATE, BASEMAP_STYLES } from "../utils/constants.js";
import {
  TAIPEI_DISTRICTS_GEOJSON,
  DISTRICT_BOUNDS,
} from "../utils/taipeiDistricts.js";

export function MaplibreDeckMap({
  layers = [],
  basemapTheme = "dark",
  selectedDistrict = "全部行政區",
  onDistrictSelect = () => {},
  mapInstanceRef,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  // 取得底圖第一個文字標籤圖層 ID (供交錯渲染置頂文字)
  const getFirstSymbolId = useCallback((map) => {
    const styleLayers = map.getStyle()?.layers || [];
    const symbolLayer = styleLayers.find((l) => l.type === "symbol");
    return symbolLayer ? symbolLayer.id : undefined;
  }, []);

  // 設定與同步 MapLibre 原生向量與 3D 建築圖層
  const setupNativeLayers = useCallback(
    (map) => {
      if (!map.isStyleLoaded()) return;

      const firstSymbolId = getFirstSymbolId(map);

      // 設定立體光影 (Lighting)
      try {
        map.setLight({
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.6,
          position: [1.15, 210, 30],
        });
      } catch (_e) {
        // 容錯保護
      }

      // 1. 注入台北市行政區向量資料源與圖層
      if (!map.getSource("taipei-districts")) {
        map.addSource("taipei-districts", {
          type: "geojson",
          data: TAIPEI_DISTRICTS_GEOJSON,
        });
      }

      if (!map.getLayer("district-fill")) {
        map.addLayer(
          {
            id: "district-fill",
            type: "fill",
            source: "taipei-districts",
            paint: {
              "fill-color": [
                "case",
                ["==", ["get", "name"], selectedDistrict],
                "rgba(56, 189, 248, 0.18)",
                "transparent",
              ],
            },
          },
          firstSymbolId
        );
      }

      if (!map.getLayer("district-line")) {
        map.addLayer(
          {
            id: "district-line",
            type: "line",
            source: "taipei-districts",
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "name"], selectedDistrict],
                "#38bdf8",
                "rgba(148, 163, 184, 0.4)",
              ],
              "line-width": [
                "case",
                ["==", ["get", "name"], selectedDistrict],
                2.5,
                1,
              ],
              "line-dasharray": [2, 2],
            },
          },
          firstSymbolId
        );
      }
    },
    [basemapTheme, selectedDistrict, getFirstSymbolId]
  );

  // 初始化 MapLibre 與 deck.gl Overlay (交錯渲染模式)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[basemapTheme],
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      pitch: INITIAL_VIEW_STATE.pitch,
      bearing: INITIAL_VIEW_STATE.bearing,
      antialias: true,
    });

    // 啟用交錯渲染 (interleaved: true) - ADR 0003
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers,
    });

    map.addControl(overlay);

    map.on("style.load", () => {
      setupNativeLayers(map);
    });

    // 行政區點擊事件
    map.on("click", "district-fill", (e) => {
      if (e.features && e.features[0]) {
        const districtName = e.features[0].properties.name;
        onDistrictSelect(districtName);
      }
    });

    map.on("mouseenter", "district-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "district-fill", () => {
      map.getCanvas().style.cursor = "";
    });

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

  // 同步行政區選中高亮與 fitBounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("district-fill")) {
      map.setPaintProperty("district-fill", "fill-color", [
        "case",
        ["==", ["get", "name"], selectedDistrict],
        "rgba(56, 189, 248, 0.20)",
        "transparent",
      ]);
    }

    if (map.getLayer("district-line")) {
      map.setPaintProperty("district-line", "line-color", [
        "case",
        ["==", ["get", "name"], selectedDistrict],
        "#38bdf8",
        "rgba(148, 163, 184, 0.4)",
      ]);
      map.setPaintProperty("district-line", "line-width", [
        "case",
        ["==", ["get", "name"], selectedDistrict],
        2.5,
        1,
      ]);
    }

    // 空間邊界貼合 (fitBounds)
    if (selectedDistrict && DISTRICT_BOUNDS[selectedDistrict]) {
      map.fitBounds(DISTRICT_BOUNDS[selectedDistrict], {
        padding: 80,
        pitch: 52,
        duration: 1200,
      });
    }
  }, [selectedDistrict]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-screen h-screen z-0"
    />
  );
}
