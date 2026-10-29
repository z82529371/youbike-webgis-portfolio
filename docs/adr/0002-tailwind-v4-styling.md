# ADR 0002: 採用 Tailwind CSS v4 整合現代化 WebGIS 介面樣式

## 脈絡 (Context)
WebGIS 儀表板需要高度精緻的浮動面板、狀態指示徽章與毛玻璃（Glassmorphism）效果。傳統行內樣式維護成本高且難以實現響應式與擬真透明度，而舊版 Tailwind v3 需仰賴額外的 PostCSS 配置檔。

## 決策 (Decision)
採用 **Tailwind CSS v4** 與官方專屬 **`@tailwindcss/vite`** 插件：
1. 擺脫 `postcss.config.js` 與繁雜的 `tailwind.config.js`，實現零配置即時編譯。
2. 在全域樣式檔中透過 `@import "tailwindcss";` 注入核心樣式引擎。
3. 全面使用 Utility Classes 重構 `ControlDock`、統計卡片與即時狀態標籤。

## 後果 (Consequences)
* 顯著減少樣式代碼冗餘，元件結構與視覺語彙更加清晰。
* 保持與現代前端及 Vite 6 的最佳相容性與極速 HMR 熱更新體驗。
