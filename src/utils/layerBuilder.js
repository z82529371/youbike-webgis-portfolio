import { ScatterplotLayer } from "@deck.gl/layers";
import { DataFilterExtension } from "@deck.gl/extensions";
import { getStationStatusColor } from "./dataTransform.js";

/**
 * 依據市民用車意圖（我要借車 / 我要還車）建立空間渲染圖層
 * @param {Object} params
 * @returns {Array} deck.gl Layer 物件清單
 */
export function buildDeckLayers({
  stations = [],
  commuterIntent = "borrow", // 'borrow' | 'return'
  selectedStation = null,
  userLocation = null,
  minThreshold = 0,
  beforeId = undefined,
  onStationClick = () => {},
  onHover = () => {},
}) {
  const layers = [];

  // 1. 市民即時站點圖層 (ScatterplotLayer)
  // 依據用車意圖動態著色：借車看可借車數，還車看可還空位
  if (stations.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: "layer-commuter-stations",
        data: stations,
        pickable: true,
        opacity: 0.92,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 5,
        radiusMaxPixels: 24,
        lineWidthMinPixels: 1.5,
        beforeId,
        getPosition: (d) => d.coordinates,
        getRadius: (d) => {
          if (selectedStation && selectedStation.id === d.id) {
            return 22; // 選中站點放大醒目標示
          }
          const count =
            commuterIntent === "borrow" ? d.availableBikes : d.emptySpaces;
          return Math.max(7, Math.min(18, count * 0.8 + 5));
        },
        getFillColor: (d) => [
          ...getStationStatusColor(d, commuterIntent),
          selectedStation && selectedStation.id === d.id ? 255 : 225,
        ],
        getLineColor: (d) => {
          if (selectedStation && selectedStation.id === d.id) {
            return [255, 255, 255, 255]; // 選中站點高亮白外框
          }
          return [255, 255, 255, 160];
        },
        getLineWidth: (d) => {
          if (selectedStation && selectedStation.id === d.id) {
            return 3.5;
          }
          return 1.2;
        },
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        // GPU 硬體著色器門檻過濾
        extensions: [new DataFilterExtension({ filterSize: 1 })],
        getFilterValue: (d) =>
          commuterIntent === "borrow" ? d.availableBikes : d.emptySpaces,
        filterRange: [minThreshold, 300],
        // GPU 屬性補間平滑過渡
        transitions: {
          getRadius: { duration: 250 },
          getFillColor: { duration: 250 },
        },
        onHover,
        onClick: (info) => {
          if (info.object) {
            onStationClick(info.object);
          }
        },
        updateTriggers: {
          getRadius: [
            commuterIntent,
            selectedStation ? selectedStation.id : null,
          ],
          getFillColor: [
            commuterIntent,
            selectedStation ? selectedStation.id : null,
          ],
          getLineColor: [selectedStation ? selectedStation.id : null],
          getLineWidth: [selectedStation ? selectedStation.id : null],
          getFilterValue: [commuterIntent],
        },
      })
    );
  }

  // 2. 市民當前 GPS 位置光標 (User Location Pulse Marker)
  if (userLocation && Array.isArray(userLocation)) {
    layers.push(
      new ScatterplotLayer({
        id: "layer-user-location-outer",
        data: [{ coordinates: userLocation }],
        pickable: false,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 14,
        radiusMaxPixels: 28,
        lineWidthMinPixels: 3,
        beforeId,
        getPosition: (d) => d.coordinates,
        getRadius: () => 20,
        getFillColor: [59, 130, 246, 70], // 柔和藍色光暈
        getLineColor: [59, 130, 246, 255],
        transitions: {
          getRadius: { duration: 400 },
        },
      }),
      new ScatterplotLayer({
        id: "layer-user-location-inner",
        data: [{ coordinates: userLocation }],
        pickable: false,
        stroked: true,
        filled: true,
        radiusMinPixels: 6,
        radiusMaxPixels: 10,
        lineWidthMinPixels: 2.5,
        beforeId,
        getPosition: (d) => d.coordinates,
        getRadius: () => 7,
        getFillColor: [37, 99, 235, 255], // 核心實心藍
        getLineColor: [255, 255, 255, 255], // 白色邊線
      })
    );
  }

  return layers;
}
