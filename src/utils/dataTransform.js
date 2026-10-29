import { STATUS_COLORS } from './constants.js';

/**
 * 將原始 API 站點資料正規化為符合 GeoJSON [lng, lat] 標準的空間特徵
 * @param {Array} rawStations
 * @returns {Array}
 */
export function transformStationData(rawStations) {
  if (!Array.isArray(rawStations)) return [];

  return rawStations.map(raw => {
    let status = 'normal';
    const rentBikes = Number(raw.available_rent_bikes) || 0;

    if (rentBikes === 0) {
      status = 'empty';
    } else if (rentBikes < 3) {
      status = 'low';
    }

    return {
      id: String(raw.sno),
      name: (raw.sna || '').replace(/^YouBike2\.0_/, ''),
      district: raw.sarea || '',
      address: raw.ar || '',
      // GIS 核心觀念：座標順序必須為 [經度 Longitude, 緯度 Latitude]
      coordinates: [Number(raw.longitude), Number(raw.latitude)],
      totalBikes: Number(raw.total) || 0,
      availableBikes: rentBikes,
      emptySpaces: Number(raw.available_return_bikes) || 0,
      status,
      statusColor: STATUS_COLORS[status],
      updateTime: raw.updateTime || ''
    };
  });
}

/**
 * 依據行政區與車位狀況篩選站點
 * @param {Array} stations
 * @param {Object} criteria
 * @returns {Array}
 */
export function filterStations(stations, criteria = {}) {
  if (!Array.isArray(stations)) return [];

  return stations.filter(station => {
    // 行政區篩選
    if (
      criteria.district &&
      criteria.district !== 'all' &&
      criteria.district !== '全部行政區' &&
      station.district !== criteria.district
    ) {
      return false;
    }

    // 車位狀態篩選
    if (criteria.status === 'emptyOnly' && station.availableBikes !== 0) {
      return false;
    }
    if (criteria.status === 'availableOnly' && station.availableBikes === 0) {
      return false;
    }

    return true;
  });
}

/**
 * 依據站點空間位置生成跨區熱門借還起訖流向 (OD Flows)
 * @param {Array} stations
 * @param {number} maxFlows
 * @returns {Array}
 */
export function generateODFlows(stations, maxFlows = 30) {
  if (!Array.isArray(stations) || stations.length < 2) return [];

  const flows = [];
  const flowCount = Math.min(maxFlows, Math.floor(stations.length / 2));

  for (let i = 0; i < flowCount; i++) {
    const origin = stations[i];
    const targetIdx = (i + Math.floor(stations.length / 3)) % stations.length;
    const dest = stations[targetIdx];

    if (!dest || origin.id === dest.id) continue;

    const tripCount = Math.floor(Math.random() * 80) + 20;

    flows.push({
      id: `flow-${origin.id}-${dest.id}`,
      fromName: origin.name,
      toName: dest.name,
      fromCoordinates: origin.coordinates,
      toCoordinates: dest.coordinates,
      tripCount,
      color: [59, 130, 246] // Tailwind blue-500
    });
  }

  return flows;
}
