// 跨都會城市配置 (預設優先載入高雄市，支援雙城流暢飛越切換)
export const CITIES = {
  kaohsiung: {
    key: "kaohsiung",
    name: "高雄市",
    subtitle: "亞灣·巨蛋·駁二",
    badge: "港都",
    areaCode: "12",
    viewState: {
      longitude: 120.3021,
      latitude: 22.628,
      zoom: 13.8,
      minZoom: 9,
      maxZoom: 18,
      pitch: 36,
      bearing: -10,
    },
    districts: [
      "全部行政區",
      "新興區",
      "苓雅區",
      "前金區",
      "三民區",
      "鹽埕區",
      "鼓山區",
      "左營區",
      "前鎮區",
      "鳳山區",
      "楠梓區",
      "旗津區",
      "小港區",
      "仁武區",
      "大社區",
      "岡山區",
      "路竹區",
      "阿蓮區",
      "田寮區",
      "燕巢區",
      "橋頭區",
      "梓官區",
      "彌陀區",
      "永安區",
      "湖內區",
      "大寮區",
      "林園區",
      "鳥松區",
      "大樹區",
      "旗山區",
      "美濃區",
      "六龜區",
      "內門區",
      "杉林區",
      "甲仙區",
      "桃源區",
      "那瑪夏區",
      "茂林區",
      "茄萣區",
    ],
  },
  taipei: {
    key: "taipei",
    name: "台北市",
    subtitle: "信義·大安·公館",
    badge: "首都",
    areaCode: "00",
    viewState: {
      longitude: 121.5436,
      latitude: 25.035,
      zoom: 13.5,
      minZoom: 9,
      maxZoom: 18,
      pitch: 38,
      bearing: -15,
    },
    districts: [
      "全部行政區",
      "大安區",
      "信義區",
      "中山區",
      "中正區",
      "松山區",
      "萬華區",
      "內湖區",
      "士林區",
      "北投區",
      "文山區",
      "南港區",
      "大同區",
    ],
  },
};

export const DEFAULT_CITY = "kaohsiung";

// 預設地理空間視角 (預設高雄市中心)
export const INITIAL_VIEW_STATE = CITIES[DEFAULT_CITY].viewState;

// 狀態顏色映射 (RGB 陣列)
export const STATUS_COLORS = {
  empty: [239, 68, 68], // 紅色 (Tailwind red-500)
  low: [245, 158, 11], // 黃色 (Tailwind amber-500)
  normal: [16, 185, 129], // 綠色 (Tailwind emerald-500)
};

// 底圖樣式 (向量樣式 - 免費開放、無 Token 限制)
export const BASEMAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// 兼容舊導出
export const DISTRICTS = CITIES[DEFAULT_CITY].districts;
