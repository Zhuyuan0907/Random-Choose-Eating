# 🍽️ 晚餐選擇器 (Random Dinner Selector)

一個幫助你隨機選擇附近餐廳的網頁應用程式！輸入你的位置和用餐時間，我們會找到附近餐廳並隨機推薦一家。

**🔓 完全免費！無需任何 API 金鑰！** 使用 OpenStreetMap 和開源技術實現。

## ✨ 功能特色

- 📍 **智慧定位**：輸入地址或使用瀏覽器定位功能
- 🕒 **時間過濾**：根據用餐時間篩選可能營業的餐廳
- 🎲 **隨機選擇**：酷炫的輪盤動畫隨機推薦餐廳
- 🗺️ **地圖整合**：使用 OpenStreetMap 顯示位置，支援 Google Maps 連結
- 📱 **響應式設計**：完美支援桌面和手機介面
- 🎨 **流暢動畫**：精美的使用者介面和互動體驗
- 🔓 **完全免費**：無需註冊或 API 金鑰，基於開源技術

## 🚀 快速開始

### 1. 克隆專案

```bash
git clone https://github.com/your-username/Random-Choose-Eating.git
cd Random-Choose-Eating
```

### 2. 直接使用 - 無需設定！

由於使用開源 API，你可以直接開始使用，無需任何設定步驟！

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
5. 無需設定任何環境變數！
6. 點選「儲存並部署」

### 方法二：直接上傳

1. 將所有檔案打包成 ZIP
2. 在 Cloudflare Pages 中選擇「直接上傳」
3. 上傳 ZIP 檔案並部署

**🎉 就這麼簡單！無需設定 API 金鑰或環境變數！**

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
- **地圖**: Leaflet.js + OpenStreetMap 瓦片
- **資料 API**: 
  - Nominatim API (OpenStreetMap 地理編碼)
  - Overpass API (OpenStreetMap 資料查詢)
- **部署**: 靜態網站（支援 Cloudflare Pages, Netlify, Vercel 等）
- **相容性**: 支援現代瀏覽器（Chrome, Firefox, Safari, Edge）
- **費用**: 完全免費，無 API 配額限制

## 📱 響應式設計

- **桌面版**: 完整地圖顯示和豐富互動
- **手機版**: 簡化介面，文字為主，Google Maps 連結
- **平板版**: 自適應介面，兼顧功能和美觀

## 🐛 常見問題

### 網路連線相關
- **地圖無法載入**: 檢查網路連線是否正常
- **搜尋無結果**: 確認網路可以存取外部 API (Nominatim, Overpass)
- **定位失敗**: 確認瀏覽器允許定位權限，或手動輸入地址

### 使用問題  
- **找不到餐廳**: 嘗試調整時間或搜尋不同地點
- **頁面載入慢**: 檢查網路連線，Overpass API 有時會比較慢
- **餐廳資料不準確**: 資料來源為 OpenStreetMap，可能不如 Google 完整

### 技術問題
- **CORS 錯誤**: 使用本地伺服器而非直接開啟 HTML 檔案
- **API 超時**: 網路較慢時可能需要等待較長時間

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🙏 致謝

- 感謝 **OpenStreetMap** 社群提供免費的地圖資料
- 感謝 **Nominatim** 提供免費的地理編碼服務  
- 感謝 **Overpass API** 提供 OpenStreetMap 資料查詢服務
- 感謝 **Leaflet.js** 提供優秀的地圖展示庫
- 感謝所有貢獻 OpenStreetMap 資料的志願者們
