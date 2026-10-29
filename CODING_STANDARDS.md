# 程式碼開發規範 (Coding Standards)

## 架構原則

1. **單一職責原則**：空間資料處理（Data Transformer）、地圖圖層配置（Layer Builder）與 UI 元件（Control Dock / Tooltip）分模組維護。
2. **純函式優先**：所有空間座標轉換、資料正規化與狀態映射邏輯必須是無副作用的純函式，以利單元測試。
3. **無 Magic Numbers**：圖層顏色（RGB/RGBA）、預設視角座標（台北中心）、預設半徑與傾角統一由常數模組管理。
