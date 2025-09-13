# 🍽️ SITCON 籌會晚餐選擇器

專為 SITCON 籌備團隊設計的餐廳選擇器！解決每次聚餐時「要吃什麼」的選擇困難症，基於 Mozilla Community Space 的位置隨機推薦附近適合的餐廳。

**🎯 定位 Mozilla Community Space**：台北市中正區重慶南路一段99號1105室（台北車站附近）

**🔓 完全免費！** 使用 OpenStreetMap 開源技術，無需任何 API 金鑰！

## ✨ 功能特色

- 👥 **人數導向**：根據聚餐人數（1-50人）推薦適合的餐廳
- 📍 **固定據點**：專為 Mozilla Community Space 附近設計，步行可達
- 🎲 **隨機選擇**：解決選擇困難症，酷炫輪盤動畫選餐廳
- 🐙 **Ricky 專屬**：特殊海底撈搜尋功能，滿足火鍋愛好者
- 🗺️ **智慧導航**：整合 Google Maps，支援手機直接導航
- 📱 **手機優化**：專為手機使用設計，隨時隨地選餐廳
- 🏷️ **中文介面**：菜系類型、餐廳資訊完全中文化
- 🚫 **過濾飲料店**：專注於正餐餐廳，排除純飲料店

## 👥 人數設定

### 快速選擇按鈕
- **小聚餐 (3人)**：適合核心幹部小聚
- **中型聚餐 (8人)**：標準工作小組聚餐
- **大型聚餐 (15人)**：部門聚餐或大型慶祝
- **🐙 Ricky 專屬海底撈**：專門搜尋火鍋餐廳

### 自訂人數
支援 1-50 人的自由設定，系統會根據人數推薦適合的餐廳類型。

## 🚀 快速開始

### 1. 線上使用（推薦）

直接在瀏覽器中開啟部署的網站即可使用，無需任何設定！

### 2. 本地開發

```bash
# 克隆專案
git clone https://github.com/Zhuyuan0907/Random-Choose-Eating.git
cd Random-Choose-Eating

# 使用本地伺服器（選擇其一）
python -m http.server 8000
# 或
npx serve .
# 或  
php -S localhost:8000

# 開啟瀏覽器
open http://localhost:8000
```

## 📁 專案結構

```
SITCON-Restaurant-Selector/
├── index.html              # 主頁面
├── styles.css              # SITCON 品牌樣式
├── script.js               # 主要邏輯 (SITCONRestaurantSelector)
├── config.js               # 設定檔（Mozilla Community Space 位置等）
├── sitcon-logo.svg         # SITCON Logo（綠色版）
├── sitcon-logo-white.svg   # SITCON Logo（白色版）
└── README.md              # 說明文件
```

## 🎮 使用流程

1. **設定人數**：選擇聚餐人數或使用快速按鈕
2. **開始搜尋**：系統自動搜尋 Mozilla Community Space 附近餐廳
3. **輪盤選擇**：享受隨機選擇的動畫過程
4. **查看結果**：獲得推薦餐廳和詳細資訊
5. **導航出發**：點選 Google Maps 連結直接導航
6. **重新選擇**：不滿意？點選「換一家試試」

## ⚙️ 技術設定

### 固定位置設定
```javascript
// config.js
const FIXED_LOCATION = {
    name: 'Mozilla Community Space',
    lat: 25.0465,
    lng: 121.5155,
    address: '台北市中正區重慶南路一段99號1105室'
};
```

### 搜尋參數
- **搜尋半徑**：800公尺（步行可達距離）
- **餐廳類型**：restaurant, fast_food（排除 cafe, bar）
- **菜系支援**：火鍋、台式料理、中式料理、日式料理等
- **資料來源**：OpenStreetMap + Overpass API

## 🔧 技術規格

- **前端框架**：原生 JavaScript ES6+
- **樣式設計**：CSS3 with SITCON 品牌色彩 (#77B55A)
- **地圖服務**：Google Maps（導航）+ OpenStreetMap（資料）
- **API 服務**：
  - Overpass API（餐廳資料查詢）
  - Nominatim API（地址解析）
- **響應式設計**：支援桌面、平板、手機
- **部署方式**：靜態網站（Cloudflare Pages, Netlify, Vercel）

## 📱 裝置支援

### 桌面版
- 完整功能展示
- 內嵌地圖預覽
- 滑鼠懸停效果

### 手機版
- 觸控優化介面
- 直接導航功能
- 簡化資訊展示
- SITCON Logo 自動縮放

## 🍜 支援菜系

系統會自動將英文菜系翻譯為中文：

- 🔥 **火鍋** (hot_pot)
- 🥢 **台式料理** (taiwanese)  
- 🥡 **中式料理** (chinese)
- 🍱 **日式料理** (japanese)
- 🌶️ **韓式料理** (korean)
- 🍝 **義式料理** (italian)
- 🍔 **美式料理** (american)
- 🌮 **多元料理** (various)

## 🐛 常見問題

### 使用問題
**Q: 為什麼搜尋不到餐廳？**  
A: 檢查網路連線，Overpass API 偶爾會較慢，請稍等或重試。

**Q: 推薦的餐廳太遠？**  
A: 系統限制在 800 公尺內，如果選項太少可能會擴大範圍。

**Q: Ricky 專屬功能找不到海底撈？**  
A: 搜尋範圍內可能沒有火鍋店，系統會自動搜尋其他火鍋類餐廳。

### 技術問題
**Q: 手機點選 Google Maps 後無法回到原頁面？**  
A: 已針對手機優化，會直接在當前分頁開啟導航。

**Q: Loading 圓圈變成橢圓？**  
A: 已修復手機版 CSS 問題，確保載入動畫保持圓形。

## 🤝 貢獻指南

歡迎 SITCON 社群成員提出建議和改進！

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 致謝

- **SITCON 社群**：提供使用場景和需求回饋
- **Mozilla Community Space**：提供聚餐據點
- **OpenStreetMap 社群**：提供免費地圖資料
- **Overpass API**：提供餐廳資料查詢服務
- **所有貢獻者**：讓這個工具變得更好用

---

**讓 SITCON 籌備聚餐不再有選擇困難症！** 🎉