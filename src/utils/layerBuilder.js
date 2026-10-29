import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ArcLayer } from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import { DataFilterExtension } from "@deck.gl/extensions";

// 3D 蜂巢熱度色彩比例階梯 (GPU 著色漸層：深藍 -> 青綠 -> 亮黃 -> 橙紅)
const HEXAGON_COLOR_RANGE = [
  [30, 58, 138, 200], // 深海藍
  [14, 165, 233, 210], // 天空藍
  [16, 185, 129, 220], // 翡翠綠
  [234, 179, 8, 230], // 亮黃
  [249, 115, 22, 240], // 鮮橙
  [239, 68, 68, 255], // 警示紅
];

/**
 * 依據當前狀態與可見性動態建立 deck.gl 圖層陣列
 * @param {Object} params
 * @returns {Array} deck.gl Layer 物件清單
 */
export function buildDeckLayers({
  stations = [],
  flows = [],
  trips = [],
  currentTime = 0,
  trailLength = 35,
  minAvailableBikes = 0,
  visibility = { scatterplot: true, hexagon: true, arc: true, trips: true },
  beforeId = undefined,
  onStationClick = () => {},
  onHover = () => {},
}) {
  const layers = [];

  // 1. 模組 1：即時站點散佈點位圖層 (ScatterplotLayer)
  // 整合 GPU 著色器硬體過濾 (DataFilterExtension) 與平滑補間動畫 (transitions)
  if (visibility.scatterplot && stations.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: "layer-stations-scatterplot",
        data: stations,
        pickable: true,
        opacity: 0.88,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 16,
        lineWidthMinPixels: 1.5,
        beforeId,
        getPosition: (d) => d.coordinates,
        getRadius: (d) => Math.max(8, Math.min(24, d.totalBikes * 0.8)),
        getFillColor: (d) => [...d.statusColor, 225],
        getLineColor: [255, 255, 255, 200],
        autoHighlight: true,
        highlightColor: [255, 255, 255, 140],
        // GPU 硬體著色器過濾
        extensions: [new DataFilterExtension({ filterSize: 1 })],
        getFilterValue: (d) => d.availableBikes,
        filterRange: [minAvailableBikes, 200],
        // GPU 屬性補間動畫
        transitions: {
          getRadius: { duration: 300 },
          getFillColor: { duration: 300 },
        },
        onHover,
        onClick: (info) => {
          if (info.object) {
            onStationClick(info.object);
          }
        },
      })
    );
  }

  // 2. 模組 2：3D 空間聚合蜂巢圖層 (HexagonLayer)
  if (visibility.hexagon && stations.length > 0) {
    layers.push(
      new HexagonLayer({
        id: "layer-density-hexagon",
        data: stations,
        pickable: true,
        extruded: true, // 啟用 3D 柱體擠出
        radius: 160, // 六角半徑 160 公尺
        elevationScale: 8, // 3D 高度乘數
        elevationRange: [0, 800],
        beforeId,
        getPosition: (d) => d.coordinates,
        getElevationWeight: (d) => d.totalBikes || 1,
        colorRange: HEXAGON_COLOR_RANGE,
        opacity: 0.65,
        coverage: 0.9,
        material: {
          ambient: 0.64,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [51, 51, 51],
        },
        onHover,
      })
    );
  }

  // 3. 模組 3：熱門借還跨區起訖流向 (ArcLayer)
  if (visibility.arc && flows.length > 0) {
    layers.push(
      new ArcLayer({
        id: "layer-od-flows-arc",
        data: flows,
        pickable: true,
        getWidth: 3.5,
        beforeId,
        getSourcePosition: (d) => d.fromCoordinates,
        getTargetPosition: (d) => d.toCoordinates,
        getSourceColor: [59, 130, 246, 220],
        getTargetColor: [236, 72, 153, 240],
        autoHighlight: true,
        highlightColor: [255, 255, 255, 160],
        onHover,
      })
    );
  }

  // 4. 模組 3 擴展：動態時空軌跡 (TripsLayer)
  if (visibility.trips && trips.length > 0) {
    layers.push(
      new TripsLayer({
        id: "layer-mobility-trips",
        data: trips,
        pickable: true,
        getPath: (d) => d.path,
        getTimestamps: (d) => d.path.map((p) => p[2]),
        getColor: (d) => d.color || [14, 165, 233],
        opacity: 0.85,
        widthMinPixels: 3.5,
        capRounded: true,
        jointRounded: true,
        trailLength,
        currentTime,
        beforeId,
        onHover,
      })
    );
  }

  return layers;
}
