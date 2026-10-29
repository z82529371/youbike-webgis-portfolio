import {
  transformStationData,
  generateODFlows,
  generateTripsData,
} from "../utils/dataTransform.js";

// 台北市政府交通局 YouBike 2.0 即時開放資料 API
const YOUBIKE_API_URL =
  "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";

/**
 * 取得 YouBike 2.0 站點即時資料
 * 包含失敗降級與模擬備援機制，確保展示永不中斷
 */
export async function fetchLiveStations() {
  try {
    const response = await fetch(YOUBIKE_API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API 請求失敗: HTTP ${response.status}`);
    }

    const rawData = await response.json();
    const stations = transformStationData(rawData);
    const flows = generateODFlows(stations, 35);
    const trips = generateTripsData(stations, 50);

    return {
      success: true,
      stations,
      flows,
      trips,
      source: "live",
      lastUpdated: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
    };
  } catch (error) {
    console.warn(
      "無法連線到即時 YouBike API，啟用高品質備用示範資料集:",
      error
    );
    const fallbackStations = generateFallbackStations();
    const flows = generateODFlows(fallbackStations, 35);
    const trips = generateTripsData(fallbackStations, 50);

    return {
      success: false,
      stations: fallbackStations,
      flows,
      trips,
      source: "fallback",
      lastUpdated: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
    };
  }
}

/**
 * 當離線或受 CORS 限制時的高品質備用資料
 */
function generateFallbackStations() {
  const districts = ["大安區", "信義區", "中山區", "中正區", "松山區"];
  const baseLng = 121.5436;
  const baseLat = 25.035;
  const sampleStations = [];

  for (let i = 1; i <= 300; i++) {
    const district = districts[i % districts.length];
    const total = 20 + (i % 25);
    const available =
      i % 5 === 0 ? 0 : i % 7 === 0 ? 2 : Math.floor(Math.random() * total);
    const lng = baseLng + (Math.random() - 0.5) * 0.08;
    const lat = baseLat + (Math.random() - 0.5) * 0.08;

    sampleStations.push({
      sno: `fallback-${i}`,
      sna: `YouBike2.0_示範站點 #${i} (${district})`,
      total,
      available_rent_bikes: available,
      available_return_bikes: total - available,
      longitude: lng,
      latitude: lat,
      sarea: district,
      ar: `${district}示範路段 ${i} 號`,
      updateTime: new Date().toISOString(),
    });
  }

  return transformStationData(sampleStations);
}
