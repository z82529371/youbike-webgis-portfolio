import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer } from '@deck.gl/layers';

// 3D 蜂巢熱度色彩比例階梯 (GPU 著色漸層：深藍 -> 青綠 -> 亮黃 -> 橙紅)
const HEXAGON_COLOR_RANGE = [
  [30, 58, 138, 200],   // 深海藍
  [14, 165, 233, 210],  // 天空藍
  [16, 185, 129, 220],  // 翡翠綠
  [234, 179, 8, 230],   // 亮黃
  [249, 115, 22, 240],  // 鮮橙
  [239, 68, 68, 255]    // 警示紅
];

/**
 * 依據當前狀態與可見性動態建立 deck.gl 圖層陣列
 * @param {Object} params
 * @returns {Array} deck.gl Layer 物件清單
 */
export function buildDeckLayers({
  stations = [],
  flows = [],
  visibility = { scatterplot: true, hexagon: true, arc: true },
  onStationClick = () => {}
}) {
  const layers = [];

  // 1. 模組 1：即時站點散佈點位圖層 (ScatterplotLayer)
  if (visibility.scatterplot && stations.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: 'layer-stations-scatterplot',
        data: stations,
        pickable: true,
        opacity: 0.85,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 15,
        lineWidthMinPixels: 1.5,
        getPosition: d => d.coordinates,
        getRadius: d => Math.max(8, Math.min(24, d.totalBikes * 0.8)),
        getFillColor: d => [...d.statusColor, 220],
        getLineColor: [255, 255, 255, 200],
        autoHighlight: true,
        highlightColor: [255, 255, 255, 120],
        onClick: info => {
          if (info.object) {
            onStationClick(info.object);
          }
        }
      })
    );
  }

  // 2. 模組 2：3D 空間聚合蜂巢圖層 (HexagonLayer)
  if (visibility.hexagon && stations.length > 0) {
    layers.push(
      new HexagonLayer({
        id: 'layer-density-hexagon',
        data: stations,
        pickable: true,
        extruded: true,               // 啟用 3D 柱體擠出
        radius: 160,                   // 六角半徑 160 公尺
        elevationScale: 8,             // 3D 高度乘數
        elevationRange: [0, 800],
        getPosition: d => d.coordinates,
        getElevationWeight: d => d.totalBikes || 1,
        colorRange: HEXAGON_COLOR_RANGE,
        opacity: 0.65,
        coverage: 0.9,
        material: {
          ambient: 0.64,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [51, 51, 51]
        }
      })
    );
  }

  // 3. 模組 3：熱門借還跨區起訖流向 (ArcLayer)
  if (visibility.arc && flows.length > 0) {
    layers.push(
      new ArcLayer({
        id: 'layer-od-flows-arc',
        data: flows,
        pickable: true,
        getWidth: 3.5,
        getSourcePosition: d => d.fromCoordinates,
        getTargetPosition: d => d.toCoordinates,
        // 起點流光漸變至迄點 (藍 -> 粉紫)
        getSourceColor: [59, 130, 246, 220],
        getTargetColor: [236, 72, 153, 240],
        autoHighlight: true,
        highlightColor: [255, 255, 255, 160]
      })
    );
  }

  return layers;
}
