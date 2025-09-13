// SITCON Organizer Nightlife Selector - Bars, Pubs & Late Night Venues  
class SITCONNightlifeSelector {
    constructor() {
        this.map = null;
        this.fixedLocation = window.NIGHTLIFE_CONFIG?.FIXED_LOCATION || {
            lat: 25.0465,
            lng: 121.5155,
            name: 'Mozilla Community Space Taipei',
            address: '台北市中正區重慶南路一段99號1105室'
        };
        this.peopleCount = 5;
        this.venues = [];
        this.currentStep = 'people-count';
        this.isProcessing = false;
        this.isMobile = window.innerWidth < 768;
        this.selectedVenue = null;
        this.isBeerMode = false;
        
        // Updated working API endpoints
        this.overpassAPIs = [
            'https://overpass-api.de/api/interpreter',
            'https://z.overpass-api.de/api/interpreter',
            'https://lz4.overpass-api.de/api/interpreter'
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
        
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.focus();
        }
    }

    bindEvents() {
        const peopleInput = document.getElementById('people-count');
        const peopleSubmit = document.getElementById('people-submit');
        
        if (peopleInput) {
            peopleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startVenueSearch();
                }
            });
            
            peopleInput.addEventListener('input', (e) => {
                this.peopleCount = parseInt(e.target.value) || 5;
                this.updatePeopleButtons();
            });
        }
        
        if (peopleSubmit) {
            peopleSubmit.addEventListener('click', () => this.startVenueSearch());
        }
        
        // People count preset buttons
        document.querySelectorAll('.people-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const count = btn.getAttribute('data-count');
                
                if (count === 'beer') {
                    this.handleBeerSpecial();
                } else {
                    this.isBeerMode = false;
                    this.peopleCount = parseInt(count);
                    
                    if (peopleInput) {
                        peopleInput.value = this.peopleCount;
                    }
                    
                    this.updatePeopleButtons();
                }
            });
        });
        
        const rerollBtn = document.getElementById('reroll');
        const startOver = document.getElementById('start-over');
        const viewOnGoogle = document.getElementById('view-on-google');
        const retryBtn = document.getElementById('retry-btn');
        
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => this.rerollVenue());
        }
        
        if (viewOnGoogle) {
            viewOnGoogle.addEventListener('click', () => this.openGoogleMaps());
        }
        
        if (startOver) {
            startOver.addEventListener('click', () => this.restart());
        }
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.restart());
        }
    }

    updatePeopleButtons() {
        document.querySelectorAll('.people-btn').forEach(btn => btn.classList.remove('active'));
        
        if (this.isBeerMode) {
            const beerBtn = document.querySelector('[data-count="beer"]');
            if (beerBtn) beerBtn.classList.add('active');
        } else {
            const matchingBtn = document.querySelector(`[data-count="${this.peopleCount}"]`);
            if (matchingBtn) matchingBtn.classList.add('active');
        }
    }

    handleBeerSpecial() {
        console.log('🍺 找間好酒吧模式啟動！');
        
        this.peopleCount = 4;
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '4';
        }
        
        document.querySelectorAll('.people-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const beerBtn = document.querySelector('.beer-special');
        if (beerBtn) {
            beerBtn.classList.add('active');
        }
        
        this.isBeerMode = true;
        this.startBeerSpecialSearch();
    }

    async startBeerSpecialSearch() {
        if (this.isProcessing) return;
        
        console.log('🍺 正在尋找好酒吧...');
        this.isProcessing = true;

        try {
            this.showStep('search');
            this.updateSearchStatus('正在為大家尋找好酒吧...');
            
            await this.searchBeerVenues();
            
            if (this.venues.length === 0) {
                throw new Error('附近沒有找到適合的酒吧，請稍後再試 😢');
            }
            
            this.updateSearchStatus('已找到酒吧！🍺');
            
            setTimeout(() => {
                this.performRandomSelection();
            }, 500);
            
        } catch (error) {
            console.error('Beer search failed:', error);
            this.showError(error.message || '尋找酒吧時出現問題，請稍後再試');
        } finally {
            this.isProcessing = false;
        }
    }

    async startVenueSearch() {
        if (this.isProcessing) return;
        
        console.log('Starting SITCON nightlife search for', this.peopleCount, 'people, Beer mode:', this.isBeerMode);
        
        this.isProcessing = true;
        this.showStep('search');
        
        try {
            if (this.isBeerMode) {
                await this.searchBeerVenues();
            } else {
                await this.searchNightlifeVenues();
            }
            
            if (this.venues.length === 0) {
                this.showError('找不到適合的續攤地點，請試試調整人數或重新搜尋');
                return;
            }
            
            console.log('Found venues:', this.venues.length);
            setTimeout(() => {
                this.performRandomSelection();
            }, 500);
            
        } catch (error) {
            console.error('Nightlife search failed:', error);
            this.showError(error.message || '搜尋續攤地點時發生錯誤，請稍後重試');
        } finally {
            this.isProcessing = false;
        }
    }

    async searchBeerVenues() {
        const radius = 1200; // Extended radius for bars
        
        // Add beer venues with known locations
        this.venues = [
            {
                name: '金色三麥台北車站店',
                lat: 25.0478,
                lng: 121.5171,
                distance: this.calculateDistance(25.0478, 121.5171, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'bar',
                cuisine: 'beer',
                address: '台北市中正區北平西路3號2樓',
                phone: '02-2311-8832',
                hours: '週一至週日 11:30-01:00'
            },
            {
                name: 'Brass Monkey 銅猴子酒吧',
                lat: 25.0425,
                lng: 121.5148,
                distance: this.calculateDistance(25.0425, 121.5148, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'bar',
                cuisine: 'cocktails',
                address: '台北市中正區臨沂街27巷1號',
                hours: '週二至週日 19:00-02:00'
            },
            {
                name: 'Draft Land 精釀啤酒吧',
                lat: 25.0441,
                lng: 121.5147,
                distance: this.calculateDistance(25.0441, 121.5147, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'bar',
                cuisine: 'beer',
                address: '台北市中正區八德路一段1號',
                hours: '週一至週日 17:00-01:00'
            }
        ];
        
        try {
            await this.searchOverpassVenues(['bar', 'pub']);
        } catch (error) {
            console.warn('Overpass search failed, using fallback venues');
        }
        
        this.venues = this.venues.filter(venue => venue.distance <= radius);
        this.updateSearchStatus(`為愛喝酒的團隊找到 ${this.venues.length} 個酒吧選項`);
    }

    async searchNightlifeVenues() {
        const radius = window.NIGHTLIFE_CONFIG?.SEARCH_RADIUS || 1200;
        
        // 重新設計：專注於真正的宵夜場所，移除飲料店
        this.venues = [
            // 24小時速食店
            {
                name: '麥當勞台北車站店',
                lat: 25.0479,
                lng: 121.5170,
                distance: this.calculateDistance(25.0479, 121.5170, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'fast_food',
                cuisine: 'burger',
                address: '台北市中正區北平西路3號1樓',
                hours: '24小時營業',
                tags: ['24小時', '速食', '宵夜必備']
            },
            {
                name: 'Sukiya 牛丼台北車站店',
                lat: 25.0475,
                lng: 121.5168,
                distance: this.calculateDistance(25.0475, 121.5168, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'fast_food',
                cuisine: 'japanese',
                address: '台北市中正區館前路8號',
                hours: '24小時營業',
                tags: ['24小時', '日式', '牛丼']
            },
            {
                name: '吉野家台北車站店',
                lat: 25.0481,
                lng: 121.5172,
                distance: this.calculateDistance(25.0481, 121.5172, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'fast_food',
                cuisine: 'japanese',
                address: '台北市中正區館前路6號',
                hours: '24小時營業',
                tags: ['24小時', '日式', '牛丼']
            },
            {
                name: 'KFC 台北車站店',
                lat: 25.0476,
                lng: 121.5165,
                distance: this.calculateDistance(25.0476, 121.5165, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'fast_food',
                cuisine: 'american',
                address: '台北市中正區北平西路3號',
                hours: '06:00-02:00',
                tags: ['深夜營業', '炸雞', '美式']
            },
            // 24小時便利商店（有熱食）
            {
                name: '7-Eleven 思源門市',
                lat: 25.0468,
                lng: 121.5156,
                distance: this.calculateDistance(25.0468, 121.5156, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'convenience_store',
                cuisine: 'convenience',
                address: '台北市中正區重慶南路一段121號',
                hours: '24小時營業',
                tags: ['24小時', '便利商店', '熱食']
            },
            {
                name: 'FamilyMart 台北車站門市',
                lat: 25.0482,
                lng: 121.5174,
                distance: this.calculateDistance(25.0482, 121.5174, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'convenience_store',
                cuisine: 'convenience',
                address: '台北市中正區北平西路3號',
                hours: '24小時營業',
                tags: ['24小時', '便利商店', '熱食']
            },
            // 深夜火鍋
            {
                name: '海底撈火鍋台北西門店',
                lat: 25.0420,
                lng: 121.5087,
                distance: this.calculateDistance(25.0420, 121.5087, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'restaurant',
                cuisine: 'hot_pot',
                address: '台北市萬華區中華路一段114號',
                hours: '週日至週四 11:00-04:00，週五至週六 11:00-05:00',
                tags: ['深夜營業', '火鍋', '聚餐']
            },
            // 深夜麵店
            {
                name: '老山東牛肉麵',
                lat: 25.0455,
                lng: 121.5140,
                distance: this.calculateDistance(25.0455, 121.5140, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'restaurant',
                cuisine: 'noodles',
                address: '台北市中正區金山南路一段121號',
                hours: '11:00-02:00',
                tags: ['深夜營業', '牛肉麵', '台式']
            },
            // 24小時餃子店
            {
                name: '八方雲集台北車站店',
                lat: 25.0471,
                lng: 121.5163,
                distance: this.calculateDistance(25.0471, 121.5163, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'fast_food',
                cuisine: 'taiwanese',
                address: '台北市中正區館前路12號',
                hours: '24小時營業',
                tags: ['24小時', '餃子', '台式']
            },
            // 深夜拉麵
            {
                name: '一蘭拉麵台北車站店',
                lat: 25.0473,
                lng: 121.5167,
                distance: this.calculateDistance(25.0473, 121.5167, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'restaurant',
                cuisine: 'japanese',
                address: '台北市中正區館前路14號',
                hours: '24小時營業',
                tags: ['24小時', '拉麵', '日式']
            }
        ];
        
        // 過濾距離並按24小時營業優先排序
        this.venues = this.venues.filter(venue => venue.distance <= radius);
        this.venues.sort((a, b) => {
            // 24小時營業的排在前面
            const a24h = a.hours?.includes('24小時');
            const b24h = b.hours?.includes('24小時');
            if (a24h && !b24h) return -1;
            if (!a24h && b24h) return 1;
            // 然後按距離排序
            return a.distance - b.distance;
        });
        
        console.log(`找到 ${this.venues.length} 個宵夜場所：`, this.venues.map(v => v.name));
        this.updateSearchStatus(`找到 ${this.venues.length} 個真正的宵夜場所`);
    }

    async searchOverpassVenues(venueTypes) {
        const lat = this.fixedLocation.lat;
        const lng = this.fixedLocation.lng;
        const radius = window.NIGHTLIFE_CONFIG?.SEARCH_RADIUS || 1200;
        
        const latDelta = (radius / 1000) / 111;
        const lngDelta = (radius / 1000) / (111 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        const venueQueries = venueTypes.map(type => {
            return `
                node["amenity"="${type}"]["name"](${south},${west},${north},${east});
                way["amenity"="${type}"]["name"](${south},${west},${north},${east});`;
        }).join('\n');

        const query = `[out:json][timeout:25];
(${venueQueries}
);
out center;`;

        for (let apiIndex = 0; apiIndex < this.overpassAPIs.length; apiIndex++) {
            const overpassAPI = this.overpassAPIs[apiIndex];
            
            try {
                console.log(`Trying Overpass API: ${overpassAPI}`);
                
                const response = await fetch(overpassAPI, {
                    method: 'POST',
                    body: query.trim(),
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'User-Agent': 'SITCONNightlifeSelector/1.0',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log(`Found ${data.elements.length} venues from Overpass`);
                
                const venues = data.elements.map(element => {
                    let elementLat, elementLng;
                    if (element.lat && element.lon) {
                        elementLat = element.lat;
                        elementLng = element.lon;
                    } else if (element.center) {
                        elementLat = element.center.lat;
                        elementLng = element.center.lon;
                    } else {
                        return null;
                    }

                    const distance = this.calculateDistance(
                        elementLat, elementLng, lat, lng
                    );

                    return {
                        name: element.tags?.name || 'Unknown',
                        lat: elementLat,
                        lng: elementLng,
                        distance: distance,
                        amenity: element.tags?.amenity || '',
                        cuisine: element.tags?.cuisine || '',
                        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
                        phone: element.tags?.phone || ''
                    };
                }).filter(venue => venue && venue.distance <= radius);

                // Merge with existing venues
                this.venues = this.venues.concat(venues);
                
                // Remove duplicates based on name
                const uniqueVenues = [];
                const seenNames = new Set();
                
                for (const venue of this.venues) {
                    if (!seenNames.has(venue.name)) {
                        uniqueVenues.push(venue);
                        seenNames.add(venue.name);
                    }
                }
                
                this.venues = uniqueVenues;
                console.log(`Total unique venues: ${this.venues.length}`);
                return;

            } catch (error) {
                console.warn(`Overpass API ${apiIndex + 1} failed:`, error);
                if (apiIndex === this.overpassAPIs.length - 1) {
                    throw new Error(`所有 API 都無法連接，請檢查網路連線: ${error.message}`);
                }
            }
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    updateSearchStatus(message) {
        const statusElement = document.getElementById('search-status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    async performRandomSelection() {
        console.log('Starting SITCON nightlife random selection with', this.venues.length, 'venues');
        
        const rouletteDisplay = document.getElementById('roulette-display');
        const venueCard = document.getElementById('current-restaurant');
        
        if (rouletteDisplay) {
            rouletteDisplay.style.display = 'block';
        }
        
        if (venueCard) {
            venueCard.classList.add('spinning');
        }

        this.updateSearchStatus(`找到 ${this.venues.length} 個適合 ${this.peopleCount} 人續攤的地點，正在選擇...`);

        const animationDuration = 1500;
        const intervalTime = 100;
        const intervals = animationDuration / intervalTime;
        let currentInterval = 0;

        const interval = setInterval(() => {
            if (currentInterval < intervals) {
                const randomVenue = this.venues[Math.floor(Math.random() * this.venues.length)];
                this.updateVenueDisplay(randomVenue);
                currentInterval++;
            } else {
                clearInterval(interval);
                
                if (venueCard) {
                    venueCard.classList.remove('spinning');
                }

                this.selectedVenue = this.venues[Math.floor(Math.random() * this.venues.length)];
                this.updateVenueDisplay(this.selectedVenue);
                
                setTimeout(() => {
                    this.showFinalResult(this.selectedVenue);
                }, 500);
            }
        }, intervalTime);
    }

    updateVenueDisplay(venue) {
        const nameElement = document.querySelector('#current-restaurant .restaurant-name');
        const infoElement = document.querySelector('#current-restaurant .restaurant-info');
        
        if (nameElement) {
            nameElement.textContent = venue.name;
        }
        
        if (infoElement) {
            const distance = (venue.distance / 1000).toFixed(1);
            const amenityText = this.getAmenityText(venue.amenity);
            let info = `${amenityText} • ${distance}km`;
            if (venue.cuisine) {
                const cuisineText = this.getCuisineText(venue.cuisine);
                info += ` • ${cuisineText}`;
            }
            infoElement.textContent = info;
        }
    }

    getAmenityText(amenity) {
        const amenityMap = {
            'restaurant': '餐廳',
            'bar': '酒吧',
            'pub': '酒館',
            'cafe': '咖啡廳',
            'fast_food': '速食',
            'food_court': '美食廣場',
            'convenience_store': '便利商店'
        };
        return amenityMap[amenity] || '續攤地點';
    }

    getCuisineText(cuisine) {
        const cuisineMap = {
            'hot_pot': '火鍋',
            'taiwanese': '台式料理',
            'chinese': '中式料理',
            'japanese': '日式料理',
            'korean': '韓式料理',
            'italian': '義式料理',
            'american': '美式料理',
            'thai': '泰式料理',
            'vietnamese': '越式料理',
            'indian': '印度料理',
            'western': '西式料理',
            'seafood': '海鮮料理',
            'bbq': '燒烤',
            'noodles': '麵食',
            'pizza': '披薩',
            'burger': '速食漢堡',
            'coffee': '咖啡輕食',
            'dessert': '甜點',
            'various': '多元料理',
            'asian': '亞洲料理',
            'international': '國際料理',
            'beer': '啤酒',
            'cocktails': '調酒',
            'wine': '紅酒',
            'convenience': '便利商店'
        };
        return cuisineMap[cuisine] || cuisine;
    }

    showFinalResult(venue) {
        console.log('Showing final result for SITCON nightlife');
        
        const finalVenueEl = document.getElementById('final-restaurant');
        if (finalVenueEl) {
            const distance = (venue.distance / 1000).toFixed(1);
            const amenityText = this.getAmenityText(venue.amenity);
            
            finalVenueEl.innerHTML = `
                <div class="name">${venue.name}</div>
                <div class="details">
                    <div class="detail">${amenityText}</div>
                    <div class="detail">距離 Mozilla Community Space ${distance} 公里</div>
                    <div class="detail">適合 ${this.peopleCount} 人續攤</div>
                    ${venue.cuisine ? `<div class="detail">類型：${this.getCuisineText(venue.cuisine)}</div>` : ''}
                    ${venue.hours ? `<div class="detail">營業時間：${venue.hours}</div>` : ''}
                    ${venue.address ? `<div class="detail">地址：${venue.address}</div>` : ''}
                    ${venue.phone ? `<div class="detail">電話：${venue.phone}</div>` : ''}
                </div>
            `;
        }
        
        this.initializeMap(venue);
        this.showStep('result');
    }

    initializeMap(venue) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || this.isMobile) return;
        
        try {
            mapContainer.innerHTML = '';
            console.log('正在初始化地圖...');
            
            // 使用更簡單且不容易被攔截的地圖嵌入方式
            const lat = venue.lat;
            const lng = venue.lng;
            const venueName = venue.name;
            
            // 創建地圖容器內容
            const mapContent = document.createElement('div');
            mapContent.style.cssText = `
                height: 100%;
                display: flex;
                flex-direction: column;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 16px;
                overflow: hidden;
            `;
            
            // 添加地圖標題
            const mapHeader = document.createElement('div');
            mapHeader.style.cssText = `
                padding: 1rem;
                background: rgba(74, 144, 226, 0.1);
                border-bottom: 1px solid rgba(74, 144, 226, 0.2);
                text-align: center;
                font-weight: 600;
                color: #4a5568;
            `;
            mapHeader.innerHTML = `📍 ${venueName}`;
            
            // 創建 iframe 容器
            const iframeContainer = document.createElement('div');
            iframeContainer.style.cssText = `flex: 1; position: relative;`;
            
            // 創建 iframe
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = '0';
            iframe.loading = 'lazy';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            
            // 使用更穩定的地圖嵌入方式，避免 X-Frame-Options 錯誤
            const embedUrl = `https://maps.google.com/maps?width=100%25&height=100%25&hl=zh-TW&q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
            iframe.src = embedUrl;
            
            // 添加載入錯誤處理
            iframe.onerror = () => {
                console.log('Google Maps 載入完成，使用備用顯示');
                this.showMapFallback(iframeContainer, venue);
            };
            
            // 添加載入成功處理
            iframe.onload = () => {
                console.log('Google Maps 載入成功');
            };
            
            // 組裝地圖
            iframeContainer.appendChild(iframe);
            mapContent.appendChild(mapHeader);
            mapContent.appendChild(iframeContainer);
            
            mapContainer.appendChild(mapContent);
            console.log('地圖嵌入成功');
            
        } catch (error) {
            console.warn('地圖初始化失敗:', error);
            this.showMapFallback(mapContainer, venue);
        }
    }
    
    showMapFallback(container, venue) {
        container.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); 
                border-radius: 16px; 
                color: #666; 
                text-align: center; 
                padding: 2rem;
                gap: 1rem;
            ">
                <div style="font-size: 2rem;">📍</div>
                <div style="font-weight: 600; color: #4a5568; margin-bottom: 0.5rem;">
                    ${venue.name}
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                    點擊下方按鈕在 Google Maps 中查看詳細位置
                </div>
                <div style="padding: 0.5rem 1rem; background: rgba(74, 144, 226, 0.1); border-radius: 8px; font-size: 0.8rem;">
                    ${venue.address || '台北車站附近'}
                </div>
            </div>
        `;
    }

    openGoogleMaps() {
        if (!this.selectedVenue) return;
        
        const venue = this.selectedVenue;
        const { lat, lng } = venue;
        
        let searchQuery = venue.name;
        if (venue.address) {
            searchQuery += ` ${venue.address}`;
        }
        
        const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${lat},${lng},18z`;
        
        if (this.isMobile) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
    }

    showStep(stepName) {
        const steps = ['people-count', 'search', 'result'];
        steps.forEach(step => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        const errorSection = document.getElementById('error-section');
        if (errorSection) {
            errorSection.style.display = 'none';
        }
        
        const targetStep = document.getElementById(`step-${stepName}`);
        if (targetStep) {
            targetStep.style.display = 'block';
            this.currentStep = stepName;
        }
        
        // Hide roulette display when changing steps
        if (stepName !== 'search') {
            const rouletteDisplay = document.getElementById('roulette-display');
            if (rouletteDisplay) {
                rouletteDisplay.style.display = 'none';
            }
        }
    }

    showError(message) {
        console.error('SITCON Nightlife Error:', message);
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorSection) {
            errorSection.style.display = 'block';
        }
        
        const steps = ['people-count', 'search', 'result'];
        steps.forEach(step => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        this.isProcessing = false;
    }

    rerollVenue() {
        if (this.venues.length === 0) return;
        
        console.log('SITCON rerolling nightlife venue selection');
        this.showStep('search');
        this.updateSearchStatus('重新為 SITCON 團隊選擇續攤地點...');
        
        setTimeout(() => {
            this.performRandomSelection();
        }, 500);
    }

    restart() {
        console.log('SITCON nightlife app restart');
        this.venues = [];
        this.selectedVenue = null;
        this.peopleCount = 5;
        this.isProcessing = false;
        this.isBeerMode = false;
        
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '5';
        }
        
        document.querySelectorAll('.people-btn').forEach(btn => btn.classList.remove('active'));
        const defaultBtn = document.querySelector('[data-count="5"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
        }
        
        // Hide roulette display
        const rouletteDisplay = document.getElementById('roulette-display');
        if (rouletteDisplay) {
            rouletteDisplay.style.display = 'none';
        }
        
        this.showStep('people-count');
        
        if (peopleInput) {
            peopleInput.focus();
        }
    }
}