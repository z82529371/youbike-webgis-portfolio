# ADR 0001: 採用 MapLibre GL JS 與 deck.gl 混合架構

## 脈絡 (Context)
求職與作品集需要展現 WebGIS 開發能力（MapLibre / Mapbox / deck.gl）。傳統單純使用 Mapbox 存在專有授權與 Token 費用限制；而僅使用純 2D 地圖庫無法展現大數據量（數萬至數十萬筆）的空間渲染效能。

## 決策 (Decision)
採用 **React + MapLibre GL JS + deck.gl** 混合架構：
1. 以 **MapLibre GL JS** 作為基礎向量底圖引擎，使用免費開放的向量底圖樣式（如 CARTO Basemaps），避免 API Token 與收費風險。
2. 以 **deck.gl** 作為上層高效能視覺化引擎，利用 WebGL 硬體加速渲染空間聚合、軌跡流向與 3D 視覺效果。
3. 透過 `@deck.gl/react` 提供的 `DeckGL` 組件與 MapLibre 同步相機視角（Viewport）。

## 後果 (Consequences)
* 擺脫商用地圖服務供應商鎖定（Vendor Lock-in），展示對開源 GIS 生態的熟悉度。
* 面對大數據集（如 10 萬點以上空間數據）時能保持 60 FPS 流暢度。
* 開發者需同時掌握 MapLibre 的底圖樣式機制與 deck.gl 的圖層生命週期。
