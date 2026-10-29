# WebGIS 互動儀表板規格說明書 (WebGIS Mobility Spec)

## 專案目標

打造一個展示 2D/3D 高效能地理空間資料視覺化的 WebGIS 作品集應用，採用 **React + MapLibre GL JS + deck.gl** 架構，以真實 **YouBike 2.0 都會微出行大數據** 為主題。

## 核心規格與功能模組

### 模組 1：即時站點狀態圖層 (ScatterplotLayer)

- 繪製所有 YouBike 2.0 站點。
- 根據車位吃緊度動態映射顏色：
  - 空車 (Empty / Danger): 可借車輛 = 0 (紅色 `[239, 68, 68]`)
  - 緊張 (Low / Warning): 可借車輛 < 3 (黃色 `[245, 158, 11]`)
  - 充足 (Sufficient / Normal): 可借車輛 >= 3 (綠色 `[16, 185, 129]`)
- 整合 `DataFilterExtension`：以 GPU 著色器硬體端過濾可借車輛數與容量，零延遲響應。
- 支援過渡補間動畫 (`transitions`)，平滑過渡半徑與顏色。
- 支援游標懸停 Tooltip 及點擊站點檢視詳細狀態（站點名稱、可借車數、可還空位、更新時間）。

### 模組 2：3D 蜂巢密度聚合圖層 (HexagonLayer)

- 透過 GPU 空間聚合將離散站點依照六角網格（Hexagon）分組。
- 六角柱狀體的高度（Elevation）依站點總車輛容積動態擠出（3D Extrusion）。
- 柱狀體顏色依站點密度漸層分布。
- 支援調整半徑（Radius）與仰角（Pitch）。

### 模組 3：熱門起訖流向圖層 (ArcLayer) 與 動態時空軌跡 (TripsLayer)

- 模擬並呈現跨區熱門站點之間的移動軌跡（Origin → Destination）。
- 以動態 3D 弧線 (Arc) 繪製起迄點，弧線依起點與終點進行色彩漸變。
- 整合 `TripsLayer` 動態時空軌跡：具備時間戳維度，結合 WebGL Shader 動態渲染運具連續移動流向。

### 模組 4：控制面板 (Control Dock)

- 圖層可見度開關（即時點位、3D 蜂巢、起訖流向、動態軌跡、3D 建築）。
- 向量底圖風格切換：暗色模式 (Dark Matter) 與亮色模式 (Positron)。
- ⚡ GPU 數據過濾滑桿：連續調整最低可借車輛門檻，達成 60 FPS 零卡頓硬體過濾。
- ⏱️ 時間軸控制器 (Timeline Controller)：支援播放、暫停與 24 小時時間進度拖曳。
- 行政區篩選器與原生聯動：切換行政區時平滑縮放至轄區外包矩形 (`fitBounds`)。
- 視角快速重設按鈕（台北市中心 3D 視角重置）。

### 模組 5：MapLibre 原生向量與 3D 建築拉伸

- 注入底圖 `fill-extrusion` 樣式層，動態渲染 3D 城市立體天際線。
- 台北市行政區 GeoJSON 原生向量面 (`fill` / `line`) 與滑鼠懸停選取高亮。
- 採用交錯渲染管線 (`interleaved: true`)，讓 deck.gl 3D 特徵與 MapLibre 3D 建築共享深度緩衝區，底圖路名標籤懸浮於最頂層。
