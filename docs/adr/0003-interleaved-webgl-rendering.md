# ADR 0003: 採用 deck.gl 與 MapLibre 交錯渲染模式 (Interleaved Rendering)

## 脈絡 (Context)

在傳統獨立 Canvas 疊加模式下，deck.gl 永遠覆蓋在 MapLibre 底圖最頂層，導致底圖路名標籤被資料遮蔽，且無法與底圖 3D 建築產生真實的三維深度穿插遮擋。

## 決策 (Decision)

在 `MapboxOverlay` 中啟用 `interleaved: true`，讓 deck.gl 與 MapLibre GL JS 共享 WebGL 渲染上下文與深度緩衝區 (Depth Buffer)，並指定資料圖層插入於底圖路名標籤 (Label Layer) 之下。

## 後果 (Consequences)

- 視覺真實度大幅提升：3D 蜂巢柱體在三維空間中具備正確的深度遮擋關係。
- 底圖路網標籤保留可讀性。
- 需嚴格監聽 MapLibre `style.load` 與主題切換生命週期，以確保 WebGL 著色管線與圖層插入順序穩定。

## 修訂紀錄 (Amendment) - 2026/10/29

- **廢棄 3D 建築與地標拉伸圖層**：因向量建物拉伸視覺效果欠佳且增加繪製負擔，已自系統中全面移除底圖 3D 建物與地標實體 (`3d-buildings`, `3d-landmarks`)。
- **維持交錯渲染架構**：持續啟用 `interleaved: true`，確保 deck.gl 空間資料圖層（3D 蜂巢柱、弧線、軌跡）能與底圖路名標籤在 WebGL 深度緩衝區中保有正確的分層遮擋與視覺清晰度。
