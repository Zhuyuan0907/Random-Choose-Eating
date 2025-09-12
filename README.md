# 🍽️ 晚餐選擇器 (Random Dinner Selector)

一個幫助你隨機選擇附近餐廳的網頁應用程式！輸入你的位置和用餐時間，我們會找到附近營業中的餐廳並隨機推薦一家。

## ✨ 功能特色

- 📍 **智慧定位**：輸入地址自動定位附近餐廳
- 🕒 **時間過濾**：根據用餐時間篩選營業中的餐廳
- 🎲 **隨機選擇**：酷炫的輪盤動畫隨機推薦餐廳
- 🗺️ **地圖整合**：桌面版顯示地圖，手機版提供 Google Maps 連結
- 📱 **響應式設計**：完美支援桌面和手機介面
- 🎨 **流暢動畫**：精美的使用者介面和互動體驗

## 🚀 快速開始

### 1. 克隆專案

```bash
git clone https://github.com/your-username/Random-Choose-Eating.git
cd Random-Choose-Eating
```

### 2. 設定 Google Maps API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. 建立 API 金鑰並設定使用限制（建議限制網域）
5. 複製 `config.example.js` 為 `config.js`：
   ```bash
   cp config.example.js config.js
   ```
6. 在 `config.js` 中替換 `YOUR_API_KEY_HERE` 為你的 API 金鑰

### 3. 本地測試

直接在瀏覽器中開啟 `index.html` 或使用本地伺服器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

然後在瀏覽器中開啟 `http://localhost:8000`

## 🌐 部署到 Cloudflare Pages

### 方法一：通過 Git 連接

1. 將程式碼推送到 GitHub
2. 登入 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 點選「建立專案」→「連接到 Git」
4. 選擇你的儲存庫
5. 在「環境變數」中設定：
   - `GOOGLE_MAPS_API_KEY`: 你的 Google Maps API 金鑰
6. 點選「儲存並部署」

### 方法二：直接上傳

1. 在 `config.js` 中設定你的 API 金鑰
2. 將所有檔案打包成 ZIP
3. 在 Cloudflare Pages 中選擇「直接上傳」
4. 上傳 ZIP 檔案並部署

## 📁 專案結構

```
Random-Choose-Eating/
├── index.html          # 主頁面
├── styles.css          # 樣式表
├── script.js           # 主要邏輯
├── config.js           # API 設定
├── config.example.js   # 設定範例
├── _headers            # Cloudflare Pages 標頭設定
└── README.md          # 說明文件
```

## 🎮 使用方法

1. **輸入位置**：在首頁輸入你目前的地址或位置
2. **選擇時間**：設定你想要用餐的時間
3. **搜尋餐廳**：系統會自動搜尋附近營業中的餐廳
4. **隨機選擇**：點選「開始選擇」享受轉盤動畫
5. **查看結果**：獲得推薦餐廳，可在 Google Maps 中查看
6. **重新選擇**：不滿意結果？點選「再來一次」

## ⚙️ 設定選項

在 `config.js` 中可以調整以下設定：

- `SEARCH_RADIUS`: 搜尋半徑（公尺，預設 2000）
- `DEFAULT_LOCATION`: 預設位置座標
- `ANIMATION.ROULETTE_DURATION`: 轉盤動畫時長
- `SEARCH.PLACE_TYPES`: 搜尋的地點類型
- `SEARCH.MIN_RATING`: 最低評分篩選
- `SEARCH.MAX_RESULTS`: 最大搜尋結果數

## 🔧 技術規格

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Google Maps JavaScript API, Places API, Geocoding API  
- **部署**: 靜態網站（支援 Cloudflare Pages, Netlify, Vercel 等）
- **相容性**: 支援現代瀏覽器（Chrome, Firefox, Safari, Edge）

## 📱 響應式設計

- **桌面版**: 完整地圖顯示和豐富互動
- **手機版**: 簡化介面，文字為主，Google Maps 連結
- **平板版**: 自適應介面，兼顧功能和美觀

## 🐛 常見問題

### API 相關
- **地圖無法載入**: 檢查 API 金鑰是否正確設定
- **搜尋無結果**: 確認 Places API 已啟用
- **定位失敗**: 檢查 Geocoding API 權限

### 使用問題  
- **找不到餐廳**: 嘗試調整時間或搜尋半徑
- **頁面載入慢**: 檢查網路連線和 API 配額

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🙏 致謝

感謝 Google Maps API 提供地圖和地點搜尋服務
