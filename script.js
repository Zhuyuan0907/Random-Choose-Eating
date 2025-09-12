// SITCON Organizer Restaurant Selector - Fixed Version  
class SITCONRestaurantSelector {
    constructor() {
        this.map = null;
        this.fixedLocation = window.CONFIG?.FIXED_LOCATION || {
            lat: 25.0465,
            lng: 121.5155,
            name: 'Mozilla Community Space Taipei',
            address: '台北市中正區重慶南路一段99號1105室'
        };
        this.peopleCount = 8;
        this.restaurants = [];
        this.currentStep = 'people-count';
        this.isProcessing = false;
        this.isMobile = window.innerWidth < 768;
        this.selectedRestaurant = null;
        
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
                    this.startFoodSearch();
                }
            });
            
            peopleInput.addEventListener('input', (e) => {
                this.peopleCount = parseInt(e.target.value) || 8;
            });
        }
        
        if (peopleSubmit) {
            peopleSubmit.addEventListener('click', () => this.startFoodSearch());
        }

        // People preset buttons
        const peopleButtons = document.querySelectorAll('.people-btn');
        peopleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const countValue = btn.dataset.count;
                
                if (countValue === 'ricky') {
                    this.handleRickySpecial();
                } else {
                    const count = parseInt(countValue);
                    if (count) {
                        this.setPeopleCount(count);
                    }
                }
            });
        });

        // Result actions
        const viewOnGoogle = document.getElementById('view-on-google');
        const reroll = document.getElementById('reroll');
        const startOver = document.getElementById('start-over');

        if (viewOnGoogle) {
            viewOnGoogle.addEventListener('click', () => this.openGoogleMaps());
        }
        if (reroll) {
            reroll.addEventListener('click', () => this.rerollRestaurant());
        }
        if (startOver) {
            startOver.addEventListener('click', () => this.restart());
        }

        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.restart());
        }
    }

    setPeopleCount(count) {
        this.peopleCount = count;
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = count;
        }
        
        document.querySelectorAll('.people-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-count="${count}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    handleRickySpecial() {
        console.log('🐙 Ricky 專屬海底撈模式啟動！');
        
        this.peopleCount = 4;
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '4';
        }
        
        document.querySelectorAll('.people-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const rickyBtn = document.querySelector('.ricky-special');
        if (rickyBtn) {
            rickyBtn.classList.add('active');
        }
        
        this.isRickyMode = true;
        this.startRickySpecialSearch();
    }

    async startRickySpecialSearch() {
        if (this.isProcessing) return;
        
        console.log('🐙 為 Ricky 尋找海底撈...');
        this.isProcessing = true;
        this.showLoading('people-loading');

        try {
            this.showStep('search');
            this.updateSearchStatus('正在為 Ricky 尋找海底撈...');
            
            const haidilaoRestaurants = await this.findHaidilaoRestaurants();
            
            if (haidilaoRestaurants.length === 0) {
                throw new Error('附近沒有找到海底撈，為 Ricky 感到遺憾 😢');
            }

            this.restaurants = haidilaoRestaurants;
            
            this.updateSearchStatus('已為 Ricky 找到海底撈！🎉');
            await this.performRickySelection();
            
        } catch (error) {
            console.error('Ricky 專屬搜尋失敗:', error);
            this.showError(error.message || '為 Ricky 尋找海底撈時出現問題，請稍後再試');
        } finally {
            this.isProcessing = false;
            this.hideLoading('people-loading');
        }
    }

    async findHaidilaoRestaurants() {
        const radius = 5000;
        const lat = this.fixedLocation.lat;
        const lng = this.fixedLocation.lng;
        
        const latDelta = radius / 111320;
        const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        const query = `[out:json][timeout:30];
(
  node["amenity"="restaurant"]["name"~"海底撈|Haidilao",i](${south},${west},${north},${east});
  way["amenity"="restaurant"]["name"~"海底撈|Haidilao",i](${south},${west},${north},${east});
);
out center;`;

        for (let apiIndex = 0; apiIndex < this.overpassAPIs.length; apiIndex++) {
            const overpassAPI = this.overpassAPIs[apiIndex];
            
            try {
                console.log(`🐙 Trying Overpass API for Haidilao: ${overpassAPI}`);
                
                const response = await fetch(overpassAPI, {
                    method: 'POST',
                    body: query.trim(),
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'User-Agent': 'SITCONRestaurantSelector/1.0-RickyMode',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log(`🐙 Found ${data.elements.length} potential Haidilao locations`);
                
                const haidilaoRestaurants = data.elements.map(element => {
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

                    const distance = this.calculateDistance(lat, lng, elementLat, elementLng);

                    return {
                        id: element.id,
                        name: element.tags?.name || '海底撈火鍋',
                        amenity: 'restaurant',
                        cuisine: 'hot_pot',
                        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
                        phone: element.tags?.phone || '',
                        website: element.tags?.website || '',
                        opening_hours: element.tags?.opening_hours || '',
                        lat: elementLat,
                        lng: elementLng,
                        distance: distance,
                        isRickySpecial: true
                    };
                }).filter(restaurant => restaurant !== null)
                  .sort((a, b) => a.distance - b.distance);

                if (haidilaoRestaurants.length > 0) {
                    console.log(`🐙 Successfully found ${haidilaoRestaurants.length} Haidilao restaurants for Ricky`);
                    return haidilaoRestaurants;
                }
                
            } catch (error) {
                console.warn(`🐙 Overpass API ${overpassAPI} failed for Ricky:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
        }
        
        // Fallback: Return a mock Haidilao for Ricky
        return [{
            id: 'ricky-fallback',
            name: '海底撈火鍋（信義店）',
            amenity: 'restaurant',
            cuisine: 'hot_pot',
            address: '台北市信義區松壽路12號',
            phone: '02-2722-8888',
            website: '',
            opening_hours: '',
            lat: 25.0368,
            lng: 121.5654,
            distance: this.calculateDistance(this.fixedLocation.lat, this.fixedLocation.lng, 25.0368, 121.5654),
            isRickySpecial: true
        }];
    }

    async performRickySelection() {
        console.log('🐙 為 Ricky 選擇最佳海底撈位置');
        
        const closestHaidilao = this.restaurants[0];
        this.selectedRestaurant = closestHaidilao;
        
        setTimeout(() => {
            this.showRickyFinalResult(closestHaidilao);
        }, 1000);
    }

    showRickyFinalResult(restaurant) {
        console.log('🐙 顯示 Ricky 的海底撈結果');
        
        this.showStep('result');
        
        const finalRestaurantEl = document.getElementById('final-restaurant');
        if (finalRestaurantEl) {
            const distance = (restaurant.distance / 1000).toFixed(1);
            
            finalRestaurantEl.innerHTML = `
                <div class="name" style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${restaurant.name}</div>
                <div class="details">
                    <div class="detail" style="background: rgba(255, 107, 107, 0.1);">Ricky 專屬海底撈</div>
                    <div class="detail">距離 Mozilla Community Space ${distance} 公里</div>
                    <div class="detail">適合 ${this.peopleCount} 人火鍋聚餐</div>
                    <div class="detail">火鍋料理</div>
                    ${restaurant.address ? `<div class="detail">地址：${restaurant.address}</div>` : ''}
                    ${restaurant.phone ? `<div class="detail">電話：${restaurant.phone}</div>` : ''}
                    <div class="detail" style="color: #ff6b6b; font-weight: bold;">Ricky 應該會很開心！</div>
                </div>
            `;
        }
        
        this.initializeMap(restaurant);
    }

    getPeopleGroupType() {
        const peopleGroups = window.CONFIG?.SEARCH?.PEOPLE_GROUPS || {
            small: { min: 1, max: 5, preferredTypes: ['cafe', 'fast_food', 'restaurant'] },
            medium: { min: 6, max: 15, preferredTypes: ['restaurant', 'cafe'] },
            large: { min: 16, max: 50, preferredTypes: ['restaurant', 'food_court'] }
        };

        for (const [groupName, group] of Object.entries(peopleGroups)) {
            if (this.peopleCount >= group.min && this.peopleCount <= group.max) {
                return group;
            }
        }

        return peopleGroups.medium;
    }

    async startFoodSearch() {
        if (this.isProcessing) return;
        
        const peopleInput = document.getElementById('people-count');
        if (!peopleInput) return;
        
        this.peopleCount = parseInt(peopleInput.value) || 8;
        
        if (this.peopleCount < 1 || this.peopleCount > 50) {
            this.showError('請輸入 1-50 之間的有效人數');
            return;
        }

        console.log('Starting SITCON food search for:', this.peopleCount, 'people');
        this.isProcessing = true;
        this.showLoading('people-loading');

        try {
            console.log('Step 1: Searching restaurants near', this.fixedLocation.name);
            this.showStep('search');
            this.updateSearchStatus('正在搜尋 Mozilla Community Space 附近餐廳...');
            const restaurants = await this.findNearbyRestaurants();
            console.log('Found restaurants:', restaurants.length);
            
            if (restaurants.length === 0) {
                throw new Error('找不到附近的餐廳，請稍後再試');
            }

            console.log('Step 2: Filtering by group size...');
            this.updateSearchStatus('正在根據人數篩選合適餐廳...');
            const suitableRestaurants = this.filterRestaurantsByPeopleCount(restaurants);
            console.log('Suitable restaurants for', this.peopleCount, 'people:', suitableRestaurants.length);
            
            if (suitableRestaurants.length === 0) {
                throw new Error('找不到適合此人數的餐廳，請嘗試調整人數');
            }

            this.restaurants = suitableRestaurants;
            
            console.log('Step 3: Performing random selection...');
            this.updateSearchStatus('正在為 SITCON 團隊隨機選擇...');
            await this.performRandomSelection();
            console.log('Random selection complete');
            
        } catch (error) {
            console.error('SITCON food search error:', error);
            this.showError(error.message || '搜尋過程中發生錯誤，請稍後再試');
        } finally {
            this.isProcessing = false;
            this.hideLoading('people-loading');
        }
    }

    filterRestaurantsByPeopleCount(restaurants) {
        const groupType = this.getPeopleGroupType();
        console.log('Group type for', this.peopleCount, 'people:', groupType);
        
        const preferredRestaurants = restaurants.filter(restaurant => {
            return groupType.preferredTypes.includes(restaurant.amenity);
        });

        return preferredRestaurants.length > 0 ? preferredRestaurants : restaurants;
    }

    async findNearbyRestaurants() {
        const radius = window.CONFIG?.SEARCH_RADIUS || 800;
        const lat = this.fixedLocation.lat;
        const lng = this.fixedLocation.lng;
        
        console.log(`尋找 ${radius}m 範圍內的餐廳...`);
        
        const latDelta = radius / 111320;
        const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        // 簡化搜索 - 只搜索有名字的餐廳和小吃店
        const query = `[out:json][timeout:25];
(
  node["amenity"="restaurant"]["name"](${south},${west},${north},${east});
  node["amenity"="fast_food"]["name"](${south},${west},${north},${east});
  way["amenity"="restaurant"]["name"](${south},${west},${north},${east});
  way["amenity"="fast_food"]["name"](${south},${west},${north},${east});
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
                        'User-Agent': 'SITCONRestaurantSelector/1.0',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log(`Found ${data.elements.length} 個有名字的餐廳/小吃店`);
                
                const restaurants = data.elements.map(element => {
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

                    const distance = this.calculateDistance(lat, lng, elementLat, elementLng);
                    
                    // 只要距離在範圍內就算有效
                    if (distance > radius) {
                        return null;
                    }

                    const name = element.tags?.name || element.tags?.['name:zh'] || element.tags?.['name:en'] || '';
                    if (!name.trim()) return null;

                    return {
                        id: element.id,
                        name: name,
                        amenity: element.tags?.amenity || 'restaurant',
                        cuisine: element.tags?.cuisine || '',
                        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || element.tags?.['addr:housenumber'] || '',
                        phone: element.tags?.phone || '',
                        website: element.tags?.website || '',
                        opening_hours: element.tags?.opening_hours || '',
                        lat: elementLat,
                        lng: elementLng,
                        distance: distance
                    };
                }).filter(restaurant => {
                    if (!restaurant) return false;
                    
                    const name = restaurant.name.toLowerCase();
                    
                    // 簡化篩選 - 只排除明顯的飲料店
                    const excludeKeywords = [
                        'starbucks', '星巴克', '50嵐', 'coco', '茶湯會', 'milkshop', '迷客夏',
                        '清心', '麻古', '老虎堂', 'bubble tea', '手搖飲', '珍珠奶茶'
                    ];
                    
                    const shouldExclude = excludeKeywords.some(keyword => 
                        name.includes(keyword)
                    );
                    
                    return !shouldExclude;
                })
                  .sort((a, b) => a.distance - b.distance);

                if (restaurants.length > 0) {
                    console.log(`篩選後找到 ${restaurants.length} 家餐廳`);
                    console.log('前5家:', restaurants.slice(0, 5).map(r => `${r.name} (${Math.round(r.distance)}m)`).join(', '));
                    return restaurants;
                }
                
            } catch (error) {
                console.warn(`Overpass API ${overpassAPI} failed:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
        }
        
        console.warn('All Overpass APIs failed, providing fallback restaurants');
        return this.getFallbackRestaurants();
    }

    getFallbackRestaurants() {
        console.log('使用備用餐廳列表...');
        const mozillaLat = this.fixedLocation.lat;
        const mozillaLng = this.fixedLocation.lng;
        
        // 提供台北車站/西門町附近真實存在的餐廳
        const fallbackRestaurants = [
            {
                id: 'fallback-1',
                name: '金峰滷肉飯',
                amenity: 'restaurant',
                cuisine: 'taiwanese',
                address: '台北市中正區羅斯福路一段10號',
                phone: '02-2396-0808',
                website: '',
                opening_hours: '',
                lat: 25.0425,
                lng: 121.5188,
                distance: this.calculateDistance(mozillaLat, mozillaLng, 25.0425, 121.5188)
            },
            {
                id: 'fallback-2',
                name: '阜杭豆漿',
                amenity: 'restaurant', 
                cuisine: 'taiwanese',
                address: '台北市中正區忠孝東路一段108號2樓',
                phone: '',
                website: '',
                opening_hours: '',
                lat: 25.0451,
                lng: 121.5249,
                distance: this.calculateDistance(mozillaLat, mozillaLng, 25.0451, 121.5249)
            },
            {
                id: 'fallback-3',
                name: '台北車站美食街',
                amenity: 'food_court',
                cuisine: 'various',
                address: '台北市中正區北平西路3號',
                phone: '',
                website: '',
                opening_hours: '',
                lat: 25.0420,
                lng: 121.5170,
                distance: this.calculateDistance(mozillaLat, mozillaLng, 25.0420, 121.5170)
            },
            {
                id: 'fallback-4',
                name: '老天祿滷味',
                amenity: 'fast_food',
                cuisine: 'taiwanese',
                address: '台北市萬華區西門街19號',
                phone: '',
                website: '',
                opening_hours: '',
                lat: 25.0422,
                lng: 121.5081,
                distance: this.calculateDistance(mozillaLat, mozillaLng, 25.0422, 121.5081)
            },
            {
                id: 'fallback-5',
                name: '寧夏夜市',
                amenity: 'food_court',
                cuisine: 'taiwanese',
                address: '台北市大同區寧夏路',
                phone: '',
                website: '',
                opening_hours: '',
                lat: 25.0563,
                lng: 121.5155,
                distance: this.calculateDistance(mozillaLat, mozillaLng, 25.0563, 121.5155)
            }
        ];
        
        console.log('Fallback restaurants:', fallbackRestaurants.map(r => `${r.name} (${Math.round(r.distance)}m)`).join(', '));
        return fallbackRestaurants.sort((a, b) => a.distance - b.distance);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000;
    }

    async performRandomSelection() {
        console.log('Starting SITCON random selection with', this.restaurants.length, 'restaurants');
        
        const rouletteDisplay = document.getElementById('roulette-display');
        const restaurantCard = document.getElementById('current-restaurant');
        
        if (rouletteDisplay) {
            rouletteDisplay.style.display = 'block';
        }
        
        if (restaurantCard) {
            restaurantCard.classList.add('spinning');
        }

        this.updateSearchStatus(`找到 ${this.restaurants.length} 家適合 ${this.peopleCount} 人的餐廳，正在選擇...`);

        const animationDuration = 1500;
        const intervalTime = 100;
        const intervals = animationDuration / intervalTime;
        let currentInterval = 0;

        const animationInterval = setInterval(() => {
            if (currentInterval < intervals) {
                const randomRestaurant = this.restaurants[Math.floor(Math.random() * this.restaurants.length)];
                this.updateRestaurantCard(randomRestaurant);
                currentInterval++;
            } else {
                clearInterval(animationInterval);
                
                const selectedRestaurant = this.restaurants[Math.floor(Math.random() * this.restaurants.length)];
                this.selectedRestaurant = selectedRestaurant;
                this.updateRestaurantCard(selectedRestaurant);
                
                setTimeout(() => {
                    if (restaurantCard) {
                        restaurantCard.classList.remove('spinning');
                        restaurantCard.classList.add('highlighting');
                    }
                    
                    setTimeout(() => {
                        this.showFinalResult(selectedRestaurant);
                    }, 500);
                }, 200);
            }
        }, intervalTime);
    }

    updateRestaurantCard(restaurant) {
        const nameElement = document.querySelector('#current-restaurant .restaurant-name');
        const infoElement = document.querySelector('#current-restaurant .restaurant-info');
        
        if (nameElement) {
            nameElement.textContent = restaurant.name;
        }
        
        if (infoElement) {
            const distance = (restaurant.distance / 1000).toFixed(1);
            const amenityText = this.getAmenityText(restaurant.amenity);
            let info = `${amenityText} • ${distance}km`;
            if (restaurant.cuisine) {
                info += ` • ${restaurant.cuisine}`;
            }
            infoElement.textContent = info;
        }
    }

    getAmenityText(amenity) {
        const amenityMap = {
            'restaurant': '餐廳',
            'fast_food': '速食',
            'cafe': '咖啡廳',
            'food_court': '美食廣場'
        };
        return amenityMap[amenity] || '餐廳';
    }

    showFinalResult(restaurant) {
        console.log('Showing final result for SITCON');
        
        this.showStep('result');
        
        const finalRestaurantEl = document.getElementById('final-restaurant');
        if (finalRestaurantEl) {
            const distance = (restaurant.distance / 1000).toFixed(1);
            const amenityText = this.getAmenityText(restaurant.amenity);
            
            finalRestaurantEl.innerHTML = `
                <div class="name">${restaurant.name}</div>
                <div class="details">
                    <div class="detail">${amenityText}</div>
                    <div class="detail">距離 Mozilla Community Space ${distance} 公里</div>
                    <div class="detail">適合 ${this.peopleCount} 人聚餐</div>
                    ${restaurant.cuisine ? `<div class="detail">菜系：${restaurant.cuisine}</div>` : ''}
                    ${restaurant.address ? `<div class="detail">地址：${restaurant.address}</div>` : ''}
                    ${restaurant.phone ? `<div class="detail">電話：${restaurant.phone}</div>` : ''}
                </div>
            `;
        }
        
        this.initializeMap(restaurant);
    }

    initializeMap(restaurant) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || this.isMobile) return;
        
        try {
            mapContainer.innerHTML = '';
            console.log('正在初始化地圖...');
            
            // 使用更簡單且不容易被攔截的地圖嵌入方式
            const lat = restaurant.lat;
            const lng = restaurant.lng;
            const restaurantName = restaurant.name;
            
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
                background: rgba(119, 181, 90, 0.1);
                border-bottom: 1px solid rgba(119, 181, 90, 0.2);
                text-align: center;
                font-weight: 600;
                color: #4a5568;
            `;
            mapHeader.innerHTML = `📍 ${restaurantName}`;
            
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
                this.showMapFallback(iframeContainer, restaurant);
            };
            
            // 添加載入成功處理
            iframe.onload = () => {
                console.log('Google Maps 載入成功');
            };
            
            // 組裝地圖
            iframeContainer.appendChild(iframe);
            mapContent.appendChild(mapHeader);
            mapContent.appendChild(iframeContainer);
            
            // 添加底部按鈕
            const mapFooter = document.createElement('div');
            mapFooter.style.cssText = `
                padding: 1rem;
                background: rgba(119, 181, 90, 0.05);
                border-top: 1px solid rgba(119, 181, 90, 0.1);
                text-align: center;
            `;
            
            const openMapBtn = document.createElement('button');
            openMapBtn.className = 'btn btn-primary';
            openMapBtn.style.cssText = `font-size: 0.9rem; padding: 0.5rem 1rem;`;
            openMapBtn.innerHTML = '在 Google Maps 開啟';
            openMapBtn.onclick = () => {
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(url, '_blank');
            };
            
            mapFooter.appendChild(openMapBtn);
            mapContent.appendChild(mapFooter);
            
            mapContainer.appendChild(mapContent);
            console.log('地圖嵌入成功');
            
        } catch (error) {
            console.warn('地圖初始化失敗:', error);
            this.showMapFallback(mapContainer, restaurant);
        }
    }
    
    showMapFallback(container, restaurant) {
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
                    ${restaurant.name}
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                    距離 Mozilla Community Space ${(restaurant.distance/1000).toFixed(1)}km
                </div>
                <button class="btn btn-primary" onclick="
                    window.open('https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}', '_blank')
                " style="font-size: 0.9rem;">
                    在 Google Maps 中查看
                </button>
            </div>
        `;
    }

    openGoogleMaps() {
        if (!this.selectedRestaurant) return;
        
        const lat = this.selectedRestaurant.lat;
        const lng = this.selectedRestaurant.lng;
        const name = encodeURIComponent(this.selectedRestaurant.name);
        
        // 使用統一的搜索格式，直接定位到餐廳
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    }

    rerollRestaurant() {
        if (this.restaurants.length === 0) return;
        
        console.log('SITCON rerolling restaurant selection');
        this.showStep('search');
        this.updateSearchStatus('重新為 SITCON 團隊選擇餐廳...');
        
        setTimeout(() => {
            this.performRandomSelection();
        }, 500);
    }

    restart() {
        console.log('SITCON app restart');
        this.restaurants = [];
        this.selectedRestaurant = null;
        this.peopleCount = 8;
        this.isProcessing = false;
        this.isRickyMode = false;
        
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '8';
        }
        
        document.querySelectorAll('.people-btn').forEach(btn => btn.classList.remove('active'));
        const defaultBtn = document.querySelector('[data-count="8"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
        }
        
        this.showStep('people-count');
        
        if (peopleInput) {
            peopleInput.focus();
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
    }

    showLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.style.display = 'none';
        }
    }

    updateSearchStatus(text) {
        const statusElement = document.getElementById('search-status-text');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }

    showError(message) {
        console.error('SITCON error:', message);
        
        this.showStep('error');
        
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (errorSection) {
            errorSection.style.display = 'block';
        }
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }
}

// Create an alias for backward compatibility
class RestaurantSelector extends SITCONRestaurantSelector {}