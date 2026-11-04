import { transformStationData } from "../utils/dataTransform.js";
import { CITIES } from "../utils/constants.js";

// 微笑單車官方全台即時 API（支援 CORS，涵蓋台北與高雄全區即時站點及 2.0E 電輔車）
const YOUBIKE_OFFICIAL_API =
  "https://apis.youbike.com.tw/json/station-yb2.json";

// 台北市政府開放資料備用 EndPoint
const TAIPEI_OPEN_DATA_API =
  "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";

/**
 * 取得指定城市的 YouBike 2.0 即時站點資料
 * @param {'kaohsiung' | 'taipei'} cityKey
 * @returns {Promise<Object>}
 */
export async function fetchLiveStations(cityKey = "kaohsiung") {
  const cityConfig = CITIES[cityKey] || CITIES.kaohsiung;

  try {
    // 優先使用官方全台即時 API，帶有 2.0E 智慧電輔車細節
    const response = await fetch(YOUBIKE_OFFICIAL_API, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`官方 API 請求失敗: HTTP ${response.status}`);
    }

    const rawData = await response.json();
    if (Array.isArray(rawData) && rawData.length > 0) {
      // 依城市 area_code 篩選 (高雄: '12', 台北: '00')
      const cityRawStations = rawData.filter(
        (s) => s.area_code === cityConfig.areaCode
      );

      if (cityRawStations.length > 0) {
        const stations = transformStationData(cityRawStations);
        return {
          success: true,
          cityKey,
          stations,
          source: "live",
          lastUpdated: new Date().toLocaleTimeString("zh-TW", {
            hour12: false,
          }),
        };
      }
    }

    // 若官方 API 未獲取到資料且是台北市，嘗試台北獨立備援 API
    if (cityKey === "taipei") {
      const tpResponse = await fetch(TAIPEI_OPEN_DATA_API, { method: "GET" });
      if (tpResponse.ok) {
        const tpData = await tpResponse.json();
        return {
          success: true,
          cityKey,
          stations: transformStationData(tpData),
          source: "live",
          lastUpdated: new Date().toLocaleTimeString("zh-TW", {
            hour12: false,
          }),
        };
      }
    }

    throw new Error("即時資料為空");
  } catch (error) {
    console.warn(
      `[${cityConfig.name}] 即時資料連線異常，啟用在地示範資料集:`,
      error
    );
    const fallbackStations = generateFallbackStations(cityKey);

    return {
      success: false,
      cityKey,
      stations: fallbackStations,
      source: "fallback",
      lastUpdated: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
    };
  }
}

/**
 * 當離線或受限制時，提供高品質在地示範資料
 * @param {'kaohsiung' | 'taipei'} cityKey
 */
function generateFallbackStations(cityKey = "kaohsiung") {
  if (cityKey === "kaohsiung") {
    return generateKaohsiungFallback();
  }
  return generateTaipeiFallback();
}

/**
 * 高雄知名核心生活圈示範站點（包含 2.0E 電輔車配置）
 */
function generateKaohsiungFallback() {
  const landmarks = [
    {
      name: "捷運美麗島站(10號出口)",
      district: "新興區",
      address: "中山一路168號前方",
      lng: 120.3021,
      lat: 22.6321,
      total: 30,
      available: 12,
      empty: 18,
      eyb: 4,
    },
    {
      name: "駁二藝術特區(大勇路)",
      district: "鹽埕區",
      address: "大勇路1號對面",
      lng: 120.2818,
      lat: 22.6202,
      total: 35,
      available: 18,
      empty: 17,
      eyb: 6,
    },
    {
      name: "高雄流行音樂中心(真愛碼頭)",
      district: "鹽埕區",
      address: "必忠街/公園二路口",
      lng: 120.2878,
      lat: 22.6215,
      total: 25,
      available: 0,
      empty: 25,
      eyb: 0,
    }, // 模擬缺車站
    {
      name: "捷運巨蛋站(2號出口)",
      district: "左營區",
      address: "博愛二路/裕誠路口",
      lng: 120.3028,
      lat: 22.6658,
      total: 40,
      available: 22,
      empty: 18,
      eyb: 8,
    },
    {
      name: "高鐵左營站",
      district: "左營區",
      address: "高鐵路105號前",
      lng: 120.3082,
      lat: 22.6874,
      total: 50,
      available: 31,
      empty: 19,
      eyb: 10,
    },
    {
      name: "凹子底森林公園(神農路)",
      district: "鼓山區",
      address: "神農路/南屏路口",
      lng: 120.3012,
      lat: 22.6582,
      total: 28,
      available: 14,
      empty: 14,
      eyb: 3,
    },
    {
      name: "高雄展覽館",
      district: "前鎮區",
      address: "成功二路39號前",
      lng: 120.3015,
      lat: 22.6105,
      total: 32,
      available: 16,
      empty: 16,
      eyb: 5,
    },
    {
      name: "衛武營國家藝術文化中心",
      district: "鳳山區",
      address: "三多一路1號前",
      lng: 120.3425,
      lat: 22.6248,
      total: 35,
      available: 19,
      empty: 16,
      eyb: 4,
    },
    {
      name: "中央公園(五福三路)",
      district: "前金區",
      address: "五福三路/中華三路口",
      lng: 120.2995,
      lat: 22.6245,
      total: 26,
      available: 2,
      empty: 24,
      eyb: 1,
    }, // 吃緊站
    {
      name: "三多商圈站(1號出口)",
      district: "苓雅區",
      address: "中山二路/三多三路口",
      lng: 120.3065,
      lat: 22.6142,
      total: 30,
      available: 30,
      empty: 0,
      eyb: 7,
    }, // 滿車站
    {
      name: "高雄火車站(站前廣場)",
      district: "三民區",
      address: "建國二路318號",
      lng: 120.3025,
      lat: 22.6395,
      total: 45,
      available: 20,
      empty: 25,
      eyb: 6,
    },
    {
      name: "西子灣站(1號出口)",
      district: "鼓山區",
      address: "臨海二路/麗雄街口",
      lng: 120.2735,
      lat: 22.6222,
      total: 30,
      available: 15,
      empty: 15,
      eyb: 5,
    },
  ];

  const now = new Date().toISOString();
  return landmarks.map((item, idx) => ({
    id: `kh-demo-${idx + 1}`,
    name: item.name,
    district: item.district,
    address: item.address,
    coordinates: [item.lng, item.lat],
    totalBikes: item.total,
    availableBikes: item.available,
    emptySpaces: item.empty,
    electricBikes: item.eyb,
    status:
      item.available === 0 ? "empty" : item.available < 3 ? "low" : "normal",
    statusColor:
      item.available === 0
        ? [239, 68, 68]
        : item.available < 3
          ? [245, 158, 11]
          : [16, 185, 129],
    updateTime: now,
  }));
}

/**
 * 台北示範站點
 */
function generateTaipeiFallback() {
  const districts = ["大安區", "信義區", "中山區", "中正區", "松山區"];
  const baseLng = 121.5436;
  const baseLat = 25.035;
  const sampleStations = [];

  for (let i = 1; i <= 150; i++) {
    const district = districts[i % districts.length];
    const total = 20 + (i % 25);
    const available =
      i % 5 === 0 ? 0 : i % 7 === 0 ? 2 : Math.floor(Math.random() * total);
    const lng = baseLng + (Math.random() - 0.5) * 0.08;
    const lat = baseLat + (Math.random() - 0.5) * 0.08;

    sampleStations.push({
      sno: `tp-demo-${i}`,
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
