# 分數學習教材

一個互動式的分數學習網頁應用程式，讓學生透過視覺化的方式理解分數概念。

## 專案展示

🔗 [線上展示 Demo](https://idben.github.io/fraction-01/)

## 功能特色

### 核心功能
- **互動式矩形分割**：點擊邊緣上的點來繪製分割線
  - 上下邊各有 7 個點（切成 8 等分）
  - 左右邊各有 3 個點（切成 4 等分）
- **區域填色**：點擊分割後的區域進行填色或取消填色
- **分數計算**：自動計算填色面積佔總面積的比例，並顯示化簡後的分數
- **視覺回饋**：
  - 點擊點位時高亮顯示可連接的對應點
  - Hover 效果提供即時視覺回饋
  - 填色區域有清晰的邊框和背景色標示

### 操作功能
- **繪製分割線**：點擊兩個對應的點位來繪製垂直線或水平線
- **刪除線條**：點擊已繪製的線條即可刪除
- **重置畫布**：清除所有線條和填色，重新開始
- **結果顯示**：使用 Dialog 顯示詳細的計算結果，包含：
  - 填色區域數量
  - 總區域數量
  - 填色面積（px²）
  - 總面積（px²）
  - 面積比例（%）
  - 原始分數
  - 化簡分數

### 視覺設計
- **半圓形點位**：與矩形邊緣完美融合的綠色半圓點
- **Bootstrap 風格按鈕**：包含 primary、danger、warning 三種顏色樣式
- **響應式設計（RWD）**：支援桌面、平板、手機等不同裝置
- **優雅的 Dialog**：半透明黑色背景遮罩與模糊效果

## 技術規格

### 技術要求
- ✅ 純 HTML/CSS/JavaScript
- ✅ 未使用任何 JS 框架
- ✅ 未使用任何 CSS 框架
- ✅ 使用 `querySelector` 與 `querySelectorAll`
- ✅ 使用 HTML5 `<dialog>` 元素代替 `alert()`
- ✅ 使用 CSS 變數設計（可調整尺寸、顏色）

### 核心技術
- **SVG 圖形**：使用 SVG 繪製矩形、圓形、線條等元素
- **狀態管理**：使用 Set 和物件管理線條和填色狀態
- **區域計算演算法**：自動計算分割後的所有區域
- **分數化簡**：使用最大公約數（GCD）演算法化簡分數
- **事件處理**：addEventListener 與 stopPropagation

### CSS 變數
```css
:root {
  --rect-width: 800px;
  --rect-height: 400px;
  --point-diameter: 30px;
  --line-width: 3px;
  --fill-color: rgba(100, 149, 237, 0.3);
  --point-color: #4CAF50;
  --rect-stroke: #4CAF50;
}
```

### RWD 斷點
- **桌面**：800x400px（預設）
- **平板**：600x300px（≤900px）
- **手機**：自適應寬度，保持 2:1 比例（≤650px）

## 使用方式

### 安裝與執行

1. **複製專案**
```bash
git clone https://github.com/your-username/fraction-learning.git
cd fraction-learning
```

2. **開啟應用程式**
   - 直接在瀏覽器中開啟 `index.html` 即可使用
   - 或使用本地伺服器（如 Live Server）

### 操作說明

1. **繪製分割線**
   - 點擊矩形邊緣上的半圓點
   - 系統會高亮顯示可連接的對應點
   - 再次點擊對應點即可繪製線條
   - 上下點連接形成垂直線，左右點連接形成水平線

2. **刪除線條**
   - 直接點擊已繪製的線條即可刪除

3. **填色區域**
   - 點擊分割後的區域進行填色
   - 再次點擊已填色的區域可取消填色

4. **顯示結果**
   - 點擊「顯示結果」按鈕查看分數計算結果
   - 結果包含原始分數和化簡後的分數

5. **重置畫布**
   - 點擊「重置」按鈕清除所有線條和填色

## 檔案結構

```
fraction-01/
├── index.html      # 主要 HTML 結構
├── styles.css      # CSS 樣式表
├── app.js          # JavaScript 邏輯
├── plan.md         # 專案規劃文件
├── task.md         # 任務清單
└── README.md       # 專案說明文件
```

## 專案架構

### HTML 結構
- `<svg>` 畫布：包含點位、矩形、線條、填色區域
- `<dialog>` 元素：顯示計算結果和警告訊息
- 控制按鈕：顯示結果、重置

### JavaScript 模組
- **初始化**：`init()`, `setupCanvas()`, `createPoints()`
- **點位處理**：`handlePointClick()`, `createPoint()`, `getPointPosition()`
- **線條管理**：`createLine()`, `drawLine()`, `handleLineClick()`
- **區域計算**：`updateRegions()`, `renderRegions()`, `handleRegionClick()`
- **分數計算**：`showResult()`, `simplifyFraction()`, `gcd()`
- **狀態管理**：使用 `state` 物件追蹤所有狀態

### CSS 設計
- **CSS 變數**：集中管理顏色、尺寸等設定
- **RWD 設計**：使用 media queries 支援多種裝置
- **視覺效果**：Hover、Active、Transition 等互動效果

## 瀏覽器支援

- Chrome（推薦）
- Firefox
- Safari
- Edge

需支援 HTML5 `<dialog>` 元素和現代 CSS 特性。

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 作者

Ben Chen

## 更新日誌

### v1.0.0 (2025-12-06)
- 初始版本發布
- 完成所有核心功能
- 支援 RWD 響應式設計
- 優化使用者體驗
