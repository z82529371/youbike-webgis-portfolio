// 台北市中心預設地理空間視角 (EPSG:4326)
export const INITIAL_VIEW_STATE = {
  longitude: 121.5436,
  latitude: 25.035,
  zoom: 13.5,
  minZoom: 9,
  maxZoom: 18,
  pitch: 38, // 38度傾斜視角，自然呈現空間深度與立體蜂巢柱
  bearing: -15,
};

// 狀態顏色映射 (RGB 陣列，deck.gl 格式)
export const STATUS_COLORS = {
  empty: [239, 68, 68], // 紅色 (Tailwind red-500)
  low: [245, 158, 11], // 黃色 (Tailwind amber-500)
  normal: [16, 185, 129], // 綠色 (Tailwind emerald-500)
};

// 底圖樣式 (MapLibre vector styles - 免費開放、無 Token 限制)
export const BASEMAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// 行政區列表
export const DISTRICTS = [
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
];
