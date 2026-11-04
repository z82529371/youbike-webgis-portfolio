import { STATUS_COLORS } from "./constants.js";

/**
 * 將原始 API 站點資料正規化為符合 GeoJSON [lng, lat] 標準的空間特徵
 * @param {Array} rawStations
 * @returns {Array}
 */
export function transformStationData(rawStations) {
  if (!Array.isArray(rawStations)) return [];

  return rawStations.map((raw) => {
    // 兼容官方 station-yb2 與政府開放資料兩套欄位命名
    const id = String(raw.station_no || raw.sno || "");
    const rawName = raw.name_tw || raw.sna || "";
    const name = rawName.replace(/^YouBike2\.0_/, "");
    const district = (raw.district_tw || raw.sarea || "").trim();
    const address = raw.address_tw || raw.ar || "";
    const lng = Number(raw.lng ?? raw.longitude) || 0;
    const lat = Number(raw.lat ?? raw.latitude) || 0;
    const totalBikes = Number(raw.parking_spaces ?? raw.total) || 0;
    const availableBikes =
      Number(raw.available_spaces ?? raw.available_rent_bikes) || 0;
    const emptySpaces =
      Number(raw.empty_spaces ?? raw.available_return_bikes) || 0;
    // 高雄特色：2.0E 智慧電輔車數量
    const electricBikes = Number(raw.available_spaces_detail?.eyb) || 0;

    let status = "normal";
    if (availableBikes === 0) {
      status = "empty";
    } else if (availableBikes < 3) {
      status = "low";
    }

    return {
      id,
      name,
      district,
      address,
      // GIS 核心觀念：座標順序必須為 [經度 Longitude, 緯度 Latitude]
      coordinates: [lng, lat],
      totalBikes,
      availableBikes,
      emptySpaces,
      electricBikes,
      status,
      statusColor: STATUS_COLORS[status],
      updateTime: raw.updated_at || raw.updateTime || "",
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

  return stations.filter((station) => {
    // 行政區篩選
    if (
      criteria.district &&
      criteria.district !== "all" &&
      criteria.district !== "全部行政區" &&
      station.district !== criteria.district
    ) {
      return false;
    }

    // 車位狀態篩選
    if (criteria.status === "emptyOnly" && station.availableBikes !== 0) {
      return false;
    }
    if (criteria.status === "availableOnly" && station.availableBikes === 0) {
      return false;
    }

    return true;
  });
}

/**
 * 計算兩組 [經度, 緯度] 座標之間的球面大圓距離 (公尺)
 * @param {Array<number>} coord1 [lon1, lat1]
 * @param {Array<number>} coord2 [lon2, lat2]
 * @returns {number} 距離 (公尺)
 */
export function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371e3; // 地球半徑 (公尺)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * 依據公尺距離推估步行時間 (分鐘)
 * 常人步行速度約 4.8 km/h = 80 m/min
 * @param {number} meters
 * @returns {number}
 */
export function estimateWalkMinutes(meters) {
  if (meters <= 0) return 0;
  return Math.max(1, Math.round(meters / 80));
}

/**
 * 依據用車意圖為站點取得狀態顏色
 * @param {Object} station
 * @param {'borrow' | 'return'} intent
 * @returns {Array<number>} RGB 陣列
 */
export function getStationStatusColor(station, intent = "borrow") {
  const count =
    intent === "borrow" ? station.availableBikes : station.emptySpaces;
  if (count === 0) return STATUS_COLORS.empty;
  if (count < 3) return STATUS_COLORS.low;
  return STATUS_COLORS.normal;
}

/**
 * 智能救援：當目標站點缺車或滿位時，自動推薦步行半徑內車源或空位充足的備援替代站
 * @param {Object} targetStation
 * @param {Array} allStations
 * @param {'borrow' | 'return'} intent
 * @param {number} maxCount
 * @param {number} maxDistance (公尺，預設 800)
 * @returns {Array}
 */
export function findAlternativeStations(
  targetStation,
  allStations,
  intent = "borrow",
  maxCount = 2,
  maxDistance = 800
) {
  if (!targetStation || !Array.isArray(allStations)) return [];

  return allStations
    .filter((s) => s.id !== targetStation.id)
    .map((s) => {
      const distance = calculateDistance(
        targetStation.coordinates,
        s.coordinates
      );
      return {
        ...s,
        distance,
        walkMinutes: estimateWalkMinutes(distance),
      };
    })
    .filter((s) => s.distance <= maxDistance)
    .filter((s) =>
      intent === "borrow" ? s.availableBikes >= 3 : s.emptySpaces >= 3
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount);
}

/**
 * 模糊搜尋站點（支援站點名稱、路名或行政區）
 * @param {Array} stations
 * @param {string} query
 * @param {number} maxResults
 * @returns {Array}
 */
export function searchStations(stations, query, maxResults = 8) {
  if (!Array.isArray(stations) || !query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  return stations
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
    )
    .slice(0, maxResults);
}

/**
 * 從指定站點群中動態計算行政區之外包矩形 (Bounding Box)
 * @param {Array} stations
 * @param {string} districtName
 * @returns {Array<Array<number>> | null} [[minLng, minLat], [maxLng, maxLat]]
 */
export function getDistrictBoundsFromStations(stations, districtName) {
  if (
    !Array.isArray(stations) ||
    !districtName ||
    districtName === "全部行政區"
  ) {
    return null;
  }

  const inDistrict = stations.filter((s) => s.district === districtName);
  if (inDistrict.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const s of inDistrict) {
    const [lng, lat] = s.coordinates;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
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
      color: [59, 130, 246], // Tailwind blue-500
    });
  }

  return flows;
}

/**
 * 依據站點空間位置生成帶時間戳的動態時空軌跡 (Trips)
 * 模擬車輛在台北市區內之位移，時間範圍映射於 24 小時虛擬時鐘 (0 ~ 1440 分鐘)
 * @param {Array} stations
 * @param {number} count
 * @returns {Array}
 */
export function generateTripsData(stations, count = 40) {
  if (!Array.isArray(stations) || stations.length < 2) return [];

  const trips = [];
  const sampleCount = Math.min(count, stations.length);

  for (let i = 0; i < sampleCount; i++) {
    const origin = stations[i];
    const targetIdx = (i * 7 + 11) % stations.length;
    const dest = stations[targetIdx];

    if (!dest || origin.id === dest.id) continue;

    // 起點時間均勻分佈在 24 小時中 (0 ~ 1400 分鐘)
    const startTime = (i * 35) % 1380;
    const duration = 20 + ((i * 13) % 25); // 20 ~ 45 分鐘移動過程
    const [lng1, lat1] = origin.coordinates;
    const [lng2, lat2] = dest.coordinates;

    const steps = 4;
    const path = [];
    for (let s = 0; s <= steps; s++) {
      const ratio = s / steps;
      // 模擬曼哈頓都市網格微幅曲折
      const jitterLng = s > 0 && s < steps ? Math.sin(s * 2.1 + i) * 0.0025 : 0;
      const jitterLat = s > 0 && s < steps ? Math.cos(s * 2.1 + i) * 0.0025 : 0;

      const lng = lng1 + (lng2 - lng1) * ratio + jitterLng;
      const lat = lat1 + (lat2 - lat1) * ratio + jitterLat;
      const timestamp = Math.round(startTime + duration * ratio);

      path.push([lng, lat, timestamp]);
    }

    trips.push({
      id: `trip-${origin.id}-${dest.id}-${i}`,
      fromName: origin.name,
      toName: dest.name,
      path,
      startTime,
      endTime: startTime + duration,
      color: [14, 165, 233], // Sky blue [14, 165, 233]
    });
  }

  return trips;
}
