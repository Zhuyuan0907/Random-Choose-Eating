// SITCON Organizer Restaurant Selector - Streamlined Version  
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
        
        // API endpoints with alternatives
        this.overpassAPIs = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter'
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        
        // Check if we're on mobile and adjust interface
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
        
        // Initialize with people count input focus
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.focus();
        }
    }

    bindEvents() {
        // People count input
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

        // Error retry
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
        
        // Update active button state
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
        
        // Set people count to 4 (reasonable for hot pot)
        this.peopleCount = 4;
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '4';
        }
        
        // Update button state
        document.querySelectorAll('.people-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const rickyBtn = document.querySelector('.ricky-special');
        if (rickyBtn) {
            rickyBtn.classList.add('active');
        }
        
        // Start special search for hot pot restaurants
        this.isRickyMode = true;
        this.startRickySpecialSearch();
    }

    async startRickySpecialSearch() {
        if (this.isProcessing) return;
        
        console.log('🐙 為 Ricky 尋找海底撈...');
        this.isProcessing = true;
        this.showLoading('people-loading');

        try {
            // Show search step
            this.showStep('search');
            this.updateSearchStatus('正在為 Ricky 尋找海底撈...');
            
            // Search for Haidilao (海底撈) specifically
            const haidilaoRestaurants = await this.findHaidilaoRestaurants();
            
            if (haidilaoRestaurants.length === 0) {
                throw new Error('附近沒有找到海底撈，為 Ricky 感到遺憾 😢');
            }

            this.restaurants = haidilaoRestaurants;
            
            // Automatically select the closest Haidilao
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
        const radius = 5000; // 5km search radius for Haidilao
        const lat = this.fixedLocation.lat;
        const lng = this.fixedLocation.lng;
        
        // Calculate bounding box
        const latDelta = radius / 111320;
        const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        // Search specifically for Haidilao
        const query = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"]["name"~"海底撈|Haidilao|haidilao",i](${south},${west},${north},${east});
          way["amenity"="restaurant"]["name"~"海底撈|Haidilao|haidilao",i](${south},${west},${north},${east});
          relation["amenity"="restaurant"]["name"~"海底撈|Haidilao|haidilao",i](${south},${west},${north},${east});
        );
        out center;
        `;

        // Try multiple Overpass APIs
        for (let apiIndex = 0; apiIndex < this.overpassAPIs.length; apiIndex++) {
            const overpassAPI = this.overpassAPIs[apiIndex];
            console.log(`🐙 Trying to find Haidilao via: ${overpassAPI}`);
            
            try {
                const response = await fetch(overpassAPI, {
                    method: 'POST',
                    body: query,
                    headers: {
                        'Content-Type': 'text/plain',
                        'User-Agent': 'SITCONRestaurantSelector/1.0-RickyMode'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log(`🐙 Found ${data.elements.length} potential Haidilao locations`);
                
                const haidilaoRestaurants = data.elements.map(element => {
                    // Get coordinates
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

                    // Calculate distance
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
                continue;
            }
        }
        
        return [];
    }

    async performRickySelection() {
        console.log('🐙 為 Ricky 選擇最佳海底撈位置');
        
        const closestHaidilao = this.restaurants[0]; // Already sorted by distance
        this.selectedRestaurant = closestHaidilao;
        
        // Show immediate result for Ricky
        setTimeout(() => {
            this.showRickyFinalResult(closestHaidilao);
        }, 1000);
    }

    showRickyFinalResult(restaurant) {
        console.log('🐙 顯示 Ricky 的海底撈結果');
        
        // Show result step
        this.showStep('result');
        
        // Populate result data with Ricky special styling
        const finalRestaurantEl = document.getElementById('final-restaurant');
        if (finalRestaurantEl) {
            const distance = (restaurant.distance / 1000).toFixed(1);
            
            finalRestaurantEl.innerHTML = `
                <div class="name" style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🐙 ${restaurant.name}</div>
                <div class="details">
                    <div class="detail" style="background: rgba(255, 107, 107, 0.1);">🔥 Ricky 專屬海底撈</div>
                    <div class="detail">📍 距離 Mozilla Community Space ${distance} 公里</div>
                    <div class="detail">👥 適合 ${this.peopleCount} 人火鍋聚餐</div>
                    <div class="detail">🍲 火鍋料理</div>
                    ${restaurant.address ? `<div class="detail">📮 ${restaurant.address}</div>` : ''}
                    ${restaurant.phone ? `<div class="detail">📞 ${restaurant.phone}</div>` : ''}
                    <div class="detail" style="color: #ff6b6b; font-weight: bold;">🎉 Ricky 應該會很開心！</div>
                </div>
            `;
        }
        
        // Initialize map
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

        // Default to medium group
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
            // Step 1: Search restaurants near Mozilla Community Space
            console.log('Step 1: Searching restaurants near', this.fixedLocation.name);
            this.showStep('search');
            this.updateSearchStatus('正在搜尋 Mozilla Community Space 附近餐廳...');
            const restaurants = await this.findNearbyRestaurants();
            console.log('Found restaurants:', restaurants.length);
            
            if (restaurants.length === 0) {
                throw new Error('找不到附近的餐廳，請稍後再試');
            }

            // Step 2: Filter by people count and preferences
            console.log('Step 2: Filtering by group size...');
            this.updateSearchStatus('正在根據人數篩選合適餐廳...');
            const suitableRestaurants = this.filterRestaurantsByPeopleCount(restaurants);
            console.log('Suitable restaurants for', this.peopleCount, 'people:', suitableRestaurants.length);
            
            if (suitableRestaurants.length === 0) {
                throw new Error('找不到適合此人數的餐廳，請嘗試調整人數');
            }

            this.restaurants = suitableRestaurants;
            
            // Step 3: Automatically select a restaurant with animation
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
        
        // Filter restaurants by preferred types for this group size
        const preferredRestaurants = restaurants.filter(restaurant => {
            return groupType.preferredTypes.includes(restaurant.amenity);
        });

        // If we have preferred restaurants, use them; otherwise fall back to all restaurants
        return preferredRestaurants.length > 0 ? preferredRestaurants : restaurants;
    }

    // Keep the rest of the methods from the original class but update them for SITCON use
    async findNearbyRestaurants() {
        const radius = window.CONFIG?.SEARCH_RADIUS || 2000; // 2km
        const lat = this.fixedLocation.lat;
        const lng = this.fixedLocation.lng;
        
        // Calculate bounding box
        const latDelta = radius / 111320; // Approximate degrees per meter
        const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        // Overpass QL query to find restaurants (excluding bubble tea and beverage shops)
        const query = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"](${south},${west},${north},${east});
          node["amenity"="fast_food"][!"cuisine"~"bubble_tea|tea|coffee|drinks"](${south},${west},${north},${east});
          node["amenity"="food_court"](${south},${west},${north},${east});
          way["amenity"="restaurant"](${south},${west},${north},${east});
          way["amenity"="fast_food"][!"cuisine"~"bubble_tea|tea|coffee|drinks"](${south},${west},${north},${east});
          way["amenity"="food_court"](${south},${west},${north},${east});
          relation["amenity"="restaurant"](${south},${west},${north},${east});
          relation["amenity"="fast_food"][!"cuisine"~"bubble_tea|tea|coffee|drinks"](${south},${west},${north},${east});
          relation["amenity"="food_court"](${south},${west},${north},${east});
        );
        out center;
        `;

        // Try multiple Overpass APIs
        for (let apiIndex = 0; apiIndex < this.overpassAPIs.length; apiIndex++) {
            const overpassAPI = this.overpassAPIs[apiIndex];
            console.log(`Trying Overpass API: ${overpassAPI}`);
            
            try {
                const response = await fetch(overpassAPI, {
                    method: 'POST',
                    body: query,
                    headers: {
                        'Content-Type': 'text/plain',
                        'User-Agent': 'SITCONRestaurantSelector/1.0'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log(`Found ${data.elements.length} elements from Overpass`);
                
                const restaurants = data.elements.map(element => {
                    // Get coordinates
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

                    // Calculate distance
                    const distance = this.calculateDistance(lat, lng, elementLat, elementLng);

                    return {
                        id: element.id,
                        name: element.tags?.name || element.tags?.['name:zh'] || element.tags?.['name:en'] || '未知餐廳',
                        amenity: element.tags?.amenity || 'restaurant',
                        cuisine: element.tags?.cuisine || '',
                        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
                        phone: element.tags?.phone || '',
                        website: element.tags?.website || '',
                        opening_hours: element.tags?.opening_hours || '',
                        lat: elementLat,
                        lng: elementLng,
                        distance: distance
                    };
                }).filter(restaurant => {
                    if (!restaurant || restaurant.name === '未知餐廳') return false;
                    
                    // Filter out bubble tea and beverage shops more strictly
                    const name = restaurant.name.toLowerCase();
                    const cuisine = restaurant.cuisine.toLowerCase();
                    
                    // Exclude bubble tea, coffee, tea, and beverage-focused places
                    const beverageKeywords = [
                        'bubble tea', 'bubble_tea', '珍珠奶茶', '手搖飲', '飲料',
                        'tea', '茶', 'coffee', '咖啡', '星巴克', 'starbucks',
                        '茶湯會', '50嵐', 'coco', '迷克夏', '清心', '茶葉蛋',
                        'drinks', 'beverage', '飲品', '奶茶', '果汁', 'juice'
                    ];
                    
                    // Check if it's primarily a beverage shop
                    const isBeverage = beverageKeywords.some(keyword => 
                        name.includes(keyword) || cuisine.includes(keyword)
                    );
                    
                    // Only include restaurants and proper food places
                    const isProperRestaurant = restaurant.amenity === 'restaurant' || 
                        restaurant.amenity === 'food_court' ||
                        (restaurant.amenity === 'fast_food' && !isBeverage);
                    
                    return isProperRestaurant && !isBeverage;
                })
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, window.CONFIG?.SEARCH?.MAX_RESULTS || 30);

                if (restaurants.length > 0) {
                    console.log(`Successfully found ${restaurants.length} restaurants`);
                    return restaurants;
                }
                
            } catch (error) {
                console.warn(`Overpass API ${overpassAPI} failed:`, error.message);
                continue;
            }
        }
        
        // If all APIs failed, throw error
        throw new Error('無法連接到餐廳資料庫，請稍後再試');
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // Return distance in meters
    }

    async performRandomSelection() {
        console.log('Starting SITCON random selection with', this.restaurants.length, 'restaurants');
        
        // Show the roulette display
        const rouletteDisplay = document.getElementById('roulette-display');
        const restaurantCard = document.getElementById('current-restaurant');
        
        if (rouletteDisplay) {
            rouletteDisplay.style.display = 'block';
        }
        
        if (restaurantCard) {
            restaurantCard.classList.add('spinning');
        }

        this.updateSearchStatus(`找到 ${this.restaurants.length} 家適合 ${this.peopleCount} 人的餐廳，正在選擇...`);

        // Show random restaurants during animation
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
                
                // Final selection
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
        
        // Show result step
        this.showStep('result');
        
        // Populate result data
        const finalRestaurantEl = document.getElementById('final-restaurant');
        if (finalRestaurantEl) {
            const distance = (restaurant.distance / 1000).toFixed(1);
            const amenityText = this.getAmenityText(restaurant.amenity);
            
            finalRestaurantEl.innerHTML = `
                <div class="name">${restaurant.name}</div>
                <div class="details">
                    <div class="detail">🏷️ ${amenityText}</div>
                    <div class="detail">📍 距離 Mozilla Community Space ${distance} 公里</div>
                    <div class="detail">👥 適合 ${this.peopleCount} 人聚餐</div>
                    ${restaurant.cuisine ? `<div class="detail">🍽️ ${restaurant.cuisine}</div>` : ''}
                    ${restaurant.address ? `<div class="detail">📮 ${restaurant.address}</div>` : ''}
                    ${restaurant.phone ? `<div class="detail">📞 ${restaurant.phone}</div>` : ''}
                </div>
            `;
        }
        
        // Initialize map (this will be replaced with Google Maps later)
        this.initializeMap(restaurant);
    }

    initializeMap(restaurant) {
        // Use Google Maps Embed API (no API key required for basic embedding)
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || this.isMobile) return;
        
        try {
            // Clear existing map content
            mapContainer.innerHTML = '';
            
            // Create Google Maps embed URL
            // We'll show the restaurant location with both the restaurant and Mozilla Community Space
            const restaurantLat = restaurant.lat;
            const restaurantLng = restaurant.lng;
            const mozillaLat = this.fixedLocation.lat;
            const mozillaLng = this.fixedLocation.lng;
            
            // Calculate center point between restaurant and Mozilla Community Space
            const centerLat = (restaurantLat + mozillaLat) / 2;
            const centerLng = (restaurantLng + mozillaLng) / 2;
            
            // Create an iframe with Google Maps embed
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = '0';
            iframe.loading = 'lazy';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            
            // Always use the restaurant name and address for better map accuracy
            const restaurantName = encodeURIComponent(restaurant.name);
            const restaurantAddress = restaurant.address ? encodeURIComponent(restaurant.address) : '';
            
            // Check if we have a Google Maps API key
            const apiKey = window.CONFIG?.MAP?.GOOGLE_MAPS_API_KEY;
            
            if (apiKey && apiKey.trim()) {
                // Use Google Maps embed with directions from Mozilla Community Space to restaurant
                const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${mozillaLat},${mozillaLng}&destination=${restaurantName}&mode=walking&language=zh-TW`;
                iframe.src = embedUrl;
            } else {
                // Use search-based embed for better accuracy (no API key required)
                let searchQuery = restaurantName;
                if (restaurantAddress) {
                    searchQuery += ` ${restaurantAddress}`;
                } else {
                    // Fallback to coordinates if no address
                    searchQuery = `${restaurantLat},${restaurantLng}`;
                }
                
                const searchUrl = `https://maps.google.com/maps?width=100%25&height=400&hl=zh&q=${encodeURIComponent(searchQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
                iframe.src = searchUrl;
            }
            
            // Add the iframe to the map container
            mapContainer.appendChild(iframe);
            
            console.log('Google Maps embedded successfully');
            
        } catch (error) {
            console.warn('Google Maps initialization failed:', error);
            
            // Fallback: show a simple link to Google Maps
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; border-radius: 16px; color: #666; text-align: center; padding: 2rem;">
                    <div>
                        <p style="margin-bottom: 1rem;">地圖載入失敗</p>
                        <button class="btn btn-primary" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}', '_blank')">
                            在 Google Maps 中查看
                        </button>
                    </div>
                </div>
            `;
        }
    }

    openGoogleMaps() {
        if (!this.selectedRestaurant) return;
        
        const lat = this.selectedRestaurant.lat;
        const lng = this.selectedRestaurant.lng;
        const name = encodeURIComponent(this.selectedRestaurant.name);
        
        const url = `https://www.google.com/maps/search/?api=1&query=${name}&query_place_id=&center=${lat},${lng}`;
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
        this.isRickyMode = false; // Clear Ricky mode
        
        // Reset people count input
        const peopleInput = document.getElementById('people-count');
        if (peopleInput) {
            peopleInput.value = '8';
        }
        
        // Reset active button
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
        // Hide all steps
        const steps = ['people-count', 'search', 'result'];
        steps.forEach(step => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Hide error section
        const errorSection = document.getElementById('error-section');
        if (errorSection) {
            errorSection.style.display = 'none';
        }
        
        // Show requested step
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

    updateLoadingText(text) {
        const spans = document.querySelectorAll('#people-loading span');
        spans.forEach(span => {
            span.textContent = text;
        });
    }

    updateSearchStatus(text) {
        const statusElement = document.getElementById('search-status-text');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }

    showError(message) {
        console.error('SITCON error:', message);
        
        // Hide all steps
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

// Restaurant Selector App - Streamlined Version (Original class for backward compatibility)
class RestaurantSelector {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.selectedTime = '18:00';
        this.restaurants = [];
        this.currentStep = 'address';
        this.isProcessing = false;
        this.isMobile = window.innerWidth < 768;
        this.selectedRestaurant = null;
        
        // API endpoints with alternatives
        this.nominatimAPIs = [
            'https://nominatim.openstreetmap.org',
            'https://nominatim.osm.org'
        ];
        this.overpassAPIs = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter'
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeTimeSelector();
        
        // Check if we're on mobile and adjust interface
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
        
        // Initialize with address input focus
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.focus();
        }
    }

    bindEvents() {
        // Address input
        const addressInput = document.getElementById('address-input');
        const addressSubmit = document.getElementById('address-submit');
        
        if (addressInput) {
            addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startFoodSearch();
                }
            });
        }
        
        if (addressSubmit) {
            addressSubmit.addEventListener('click', () => this.startFoodSearch());
        }

        // Time selection in header
        const timeSelector = document.getElementById('meal-time-header');
        if (timeSelector) {
            timeSelector.addEventListener('change', (e) => {
                this.selectedTime = e.target.value;
            });
        }

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

        // Error retry
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.restart());
        }
    }

    initializeTimeSelector() {
        const timeSelector = document.getElementById('meal-time-header');
        if (timeSelector) {
            this.selectedTime = timeSelector.value || '18:00';
        }
    }

    async startFoodSearch() {
        if (this.isProcessing) return;
        
        const addressInput = document.getElementById('address-input');
        if (!addressInput) return;
        
        const address = addressInput.value.trim();
        
        if (!address) {
            this.showError('請輸入有效的地址');
            return;
        }

        console.log('Starting food search for:', address);
        this.isProcessing = true;
        this.showLoading('address-loading');

        try {
            // Step 1: Geocode address
            console.log('Step 1: Geocoding address...');
            this.updateLoadingText('正在定位...');
            const location = await this.geocodeAddress(address);
            console.log('Geocoding successful:', location);
            this.userLocation = location;
            
            // Step 2: Search restaurants
            console.log('Step 2: Searching restaurants...');
            this.showStep('search');
            this.updateSearchStatus('正在搜尋附近餐廳...');
            const restaurants = await this.findNearbyRestaurants();
            console.log('Found restaurants:', restaurants.length);
            
            if (restaurants.length === 0) {
                throw new Error('找不到附近的餐廳，請嘗試其他地點');
            }

            // Step 3: Filter by time
            console.log('Step 3: Filtering by time...');
            this.updateSearchStatus('正在篩選營業中餐廳...');
            const openRestaurants = this.filterRestaurantsByTime(restaurants);
            console.log('Filtered restaurants:', openRestaurants.length);
            
            if (openRestaurants.length === 0) {
                throw new Error('找不到在此時間可能營業的餐廳，請嘗試其他時間');
            }

            this.restaurants = openRestaurants;
            
            // Step 4: Automatically select a restaurant with animation
            console.log('Step 4: Performing random selection...');
            this.updateSearchStatus('正在為你隨機選擇...');
            await this.performRandomSelection();
            console.log('Random selection complete');
            
        } catch (error) {
            console.error('Food search error:', error);
            this.showError(error.message || '搜尋過程中發生錯誤，請稍後再試');
        } finally {
            this.isProcessing = false;
            this.hideLoading('address-loading');
        }
    }

    async geocodeAddress(address) {
        console.log('Starting geocoding for:', address);
        
        // Simple and direct approach first
        const searchQueries = [
            `${address}`,
            `${address}, 台灣`,
            `${address}, Taiwan`
        ];

        // Try primary API first
        for (const query of searchQueries) {
            try {
                console.log(`Trying query: ${query}`);
                
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&accept-language=zh-TW,zh,en`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'RestaurantSelector/1.0'
                    }
                });
                
                if (!response.ok) {
                    console.warn(`HTTP ${response.status} for ${query}`);
                    continue;
                }
                
                const data = await response.json();
                console.log(`Response for "${query}":`, data.length, 'results');
                
                if (data && data.length > 0) {
                    const result = data[0];
                    console.log(`Found: ${result.display_name}`);
                    
                    return {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon),
                        address: result.display_name
                    };
                }
                
                // Wait between requests
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.warn(`Failed query "${query}":`, error.message);
                continue;
            }
        }
        
        // If all failed, try backup API
        try {
            console.log('Trying backup API...');
            const url = `https://nominatim.osm.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&accept-language=zh-TW,zh,en`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'RestaurantSelector/1.0'
                }
            });
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                console.log(`Backup API found: ${result.display_name}`);
                
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    address: result.display_name
                };
            }
        } catch (error) {
            console.error('Backup API failed:', error);
        }
        
        throw new Error(`找不到地址："${address}"，請嘗試更具體的地名，例如：台北車站、高雄火車站`);
    }

    async findNearbyRestaurants() {
        const radius = window.CONFIG?.SEARCH_RADIUS || 2000; // 2km
        const lat = this.userLocation.lat;
        const lng = this.userLocation.lng;
        
        // Calculate bounding box
        const latDelta = radius / 111320; // Approximate degrees per meter
        const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
        
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;

        // Overpass QL query to find restaurants
        const query = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"](${south},${west},${north},${east});
          node["amenity"="fast_food"](${south},${west},${north},${east});
          node["amenity"="cafe"](${south},${west},${north},${east});
          node["amenity"="food_court"](${south},${west},${north},${east});
          way["amenity"="restaurant"](${south},${west},${north},${east});
          way["amenity"="fast_food"](${south},${west},${north},${east});
          way["amenity"="cafe"](${south},${west},${north},${east});
          way["amenity"="food_court"](${south},${west},${north},${east});
          relation["amenity"="restaurant"](${south},${west},${north},${east});
          relation["amenity"="fast_food"](${south},${west},${north},${east});
          relation["amenity"="cafe"](${south},${west},${north},${east});
          relation["amenity"="food_court"](${south},${west},${north},${east});
        );
        out center;
        `;

        // Try multiple Overpass APIs
        for (let apiIndex = 0; apiIndex < this.overpassAPIs.length; apiIndex++) {
            const overpassAPI = this.overpassAPIs[apiIndex];
            console.log(`Trying Overpass API: ${overpassAPI}`);
            
            try {
                const response = await fetch(overpassAPI, {
                    method: 'POST',
                    body: query,
                    headers: {
                        'Content-Type': 'text/plain',
                        'User-Agent': 'RestaurantSelector/1.0'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log(`Found ${data.elements.length} elements from Overpass`);
                
                const restaurants = data.elements.map(element => {
                    // Get coordinates
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

                    // Calculate distance
                    const distance = this.calculateDistance(lat, lng, elementLat, elementLng);

                    return {
                        id: element.id,
                        name: element.tags?.name || element.tags?.['name:zh'] || element.tags?.['name:en'] || '未知餐廳',
                        amenity: element.tags?.amenity || 'restaurant',
                        cuisine: element.tags?.cuisine || '',
                        address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
                        phone: element.tags?.phone || '',
                        website: element.tags?.website || '',
                        opening_hours: element.tags?.opening_hours || '',
                        lat: elementLat,
                        lng: elementLng,
                        distance: distance
                    };
                }).filter(restaurant => {
                    if (!restaurant || restaurant.name === '未知餐廳') return false;
                    
                    // Filter out bubble tea and beverage shops more strictly
                    const name = restaurant.name.toLowerCase();
                    const cuisine = restaurant.cuisine.toLowerCase();
                    
                    // Exclude bubble tea, coffee, tea, and beverage-focused places
                    const beverageKeywords = [
                        'bubble tea', 'bubble_tea', '珍珠奶茶', '手搖飲', '飲料',
                        'tea', '茶', 'coffee', '咖啡', '星巴克', 'starbucks',
                        '茶湯會', '50嵐', 'coco', '迷克夏', '清心', '茶葉蛋',
                        'drinks', 'beverage', '飲品', '奶茶', '果汁', 'juice'
                    ];
                    
                    // Check if it's primarily a beverage shop
                    const isBeverage = beverageKeywords.some(keyword => 
                        name.includes(keyword) || cuisine.includes(keyword)
                    );
                    
                    // Only include restaurants and proper food places
                    const isProperRestaurant = restaurant.amenity === 'restaurant' || 
                        restaurant.amenity === 'food_court' ||
                        (restaurant.amenity === 'fast_food' && !isBeverage);
                    
                    return isProperRestaurant && !isBeverage;
                })
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, window.CONFIG?.SEARCH?.MAX_RESULTS || 30);

                if (restaurants.length > 0) {
                    console.log(`Successfully found ${restaurants.length} restaurants`);
                    return restaurants;
                }
                
            } catch (error) {
                console.warn(`Overpass API ${overpassAPI} failed:`, error.message);
                continue;
            }
        }
        
        // If all APIs failed, throw error
        throw new Error('無法連接到餐廳資料庫，請稍後再試');
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // Return distance in meters
    }

    filterRestaurantsByTime(restaurants) {
        const selectedTime = this.parseTime(this.selectedTime);
        
        return restaurants.filter(restaurant => {
            // If no opening hours data, assume it might be open
            if (!restaurant.opening_hours) {
                return true;
            }

            // Basic opening hours parsing (simplified)
            return this.isRestaurantOpenBasic(restaurant.opening_hours, selectedTime);
        });
    }

    isRestaurantOpenBasic(openingHours, selectedTime) {
        // Very basic parsing of opening hours
        const hoursLower = openingHours.toLowerCase();
        
        // If it says 24/7 or always open
        if (hoursLower.includes('24/7') || hoursLower.includes('24 hours')) {
            return true;
        }

        // If it's closed, skip
        if (hoursLower.includes('closed') || hoursLower.includes('off')) {
            return false;
        }

        // For simplicity, if we can't parse it properly, assume it might be open during dinner hours
        if (selectedTime >= 17 * 60 && selectedTime <= 21 * 60) { // 5 PM to 9 PM
            return true;
        }

        return true; // Default to open
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes; // Convert to minutes
    }

    async performRandomSelection() {
        console.log('Starting random selection with', this.restaurants.length, 'restaurants');
        
        // Show the roulette display
        const rouletteDisplay = document.getElementById('roulette-display');
        const restaurantCard = document.getElementById('current-restaurant');
        
        if (rouletteDisplay) {
            rouletteDisplay.style.display = 'block';
            console.log('Roulette display shown');
        } else {
            console.warn('Roulette display not found');
        }
        
        if (restaurantCard) {
            restaurantCard.classList.add('spinning');
            console.log('Added spinning class');
        } else {
            console.warn('Restaurant card not found');
        }

        this.updateSearchStatus(`找到 ${this.restaurants.length} 家餐廳，正在選擇...`);

        // Show random restaurants during animation
        const animationDuration = 1500; // Shorter duration for testing
        const intervalTime = 100;
        const intervals = animationDuration / intervalTime;
        let currentInterval = 0;

        console.log(`Starting animation: ${intervals} intervals`);

        const animationInterval = setInterval(() => {
            if (currentInterval < intervals) {
                const randomRestaurant = this.restaurants[Math.floor(Math.random() * this.restaurants.length)];
                this.updateRestaurantCard(randomRestaurant);
                currentInterval++;
            } else {
                clearInterval(animationInterval);
                console.log('Animation complete, selecting final restaurant');
                
                // Final selection
                const selectedRestaurant = this.restaurants[Math.floor(Math.random() * this.restaurants.length)];
                this.updateRestaurantCard(selectedRestaurant);
                console.log('Final restaurant selected:', selectedRestaurant.name);
                
                setTimeout(() => {
                    if (restaurantCard) {
                        restaurantCard.classList.remove('spinning');
                        restaurantCard.classList.add('highlighting');
                        console.log('Added highlighting class');
                    }
                    
                    setTimeout(() => {
                        if (restaurantCard) {
                            restaurantCard.classList.remove('highlighting');
                        }
                        console.log('Showing final result');
                        this.showFinalResult(selectedRestaurant);
                    }, 800);
                }, 500);
            }
        }, intervalTime);
    }

    updateRestaurantCard(restaurant) {
        const restaurantCard = document.getElementById('current-restaurant');
        if (!restaurantCard) return;
        
        const restaurantName = restaurantCard.querySelector('.restaurant-name');
        const restaurantInfo = restaurantCard.querySelector('.restaurant-info');

        if (restaurantName) {
            restaurantName.textContent = restaurant.name;
        }
        
        const cuisine = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : '';
        const distance = `📍 ${(restaurant.distance / 1000).toFixed(1)}km`;
        const amenity = this.getAmenityIcon(restaurant.amenity);
        
        if (restaurantInfo) {
            restaurantInfo.innerHTML = `
                <div>${amenity} ${cuisine}</div>
                <div style="font-size: 0.8rem; opacity: 0.7;">${distance}</div>
            `;
        }
    }

    getAmenityIcon(amenity) {
        const icons = {
            'restaurant': '🍽️',
            'fast_food': '🍔',
            'cafe': '☕',
            'food_court': '🍱'
        };
        return icons[amenity] || '🍽️';
    }

    showFinalResult(restaurant) {
        this.selectedRestaurant = restaurant;
        const resultContainer = document.getElementById('final-restaurant');
        if (!resultContainer) return;
        
        const cuisine = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : '';
        const distance = `📍 ${(restaurant.distance / 1000).toFixed(1)}km`;
        const amenityIcon = this.getAmenityIcon(restaurant.amenity);
        
        resultContainer.innerHTML = `
            <div class="name">${restaurant.name}</div>
            <div class="details">
                <div class="detail">${amenityIcon} ${restaurant.amenity}</div>
                <div class="detail">${cuisine}</div>
                <div class="detail">${distance}</div>
                <div class="detail">🕒 選擇時間: ${this.formatTime(this.selectedTime)}</div>
                ${restaurant.address ? `<div class="detail">📍 ${restaurant.address}</div>` : ''}
                ${restaurant.phone ? `<div class="detail">📞 ${restaurant.phone}</div>` : ''}
            </div>
        `;

        // Load map on desktop
        if (!this.isMobile) {
            this.initializeMap(restaurant.lat, restaurant.lng, restaurant);
        }

        this.showStep('result');
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    async rerollRestaurant() {
        if (this.restaurants.length === 0) return;
        
        // Go back to search step and perform new random selection
        this.showStep('search');
        this.updateSearchStatus('正在重新選擇...');
        
        // Wait a moment for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await this.performRandomSelection();
    }

    initializeMap(lat, lng, restaurant) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer || typeof L === 'undefined') return;

        try {
            // Clear existing map
            if (this.map) {
                this.map.remove();
            }

            // Create new map
            this.map = L.map(mapContainer).setView([lat, lng], 16);

            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Add marker for restaurant
            const marker = L.marker([lat, lng]).addTo(this.map);
            marker.bindPopup(`<b>${restaurant.name}</b><br>${restaurant.address || ''}`);

            // Add marker for user location if available
            if (this.userLocation) {
                const userMarker = L.marker([this.userLocation.lat, this.userLocation.lng])
                    .addTo(this.map);
                userMarker.bindPopup('你的位置');
                
                // Fit map to show both markers
                const group = new L.featureGroup([marker, userMarker]);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }

        } catch (error) {
            console.error('Map initialization error:', error);
        }
    }

    showStep(stepName) {
        // Hide all steps
        document.querySelectorAll('.step, .error-section').forEach(step => {
            step.style.display = 'none';
        });

        // Show current step
        const stepElement = document.getElementById(`step-${stepName}`);
        if (stepElement) {
            stepElement.style.display = 'block';
            stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        this.currentStep = stepName;
    }

    showLoading(elementId) {
        const loading = document.getElementById(elementId);
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading(elementId) {
        const loading = document.getElementById(elementId);
        if (loading) {
            loading.style.display = 'none';
        }
    }

    updateLoadingText(text) {
        const loadingSpan = document.querySelector('#address-loading span');
        if (loadingSpan) {
            loadingSpan.textContent = text;
        }
    }

    updateSearchStatus(message) {
        const statusText = document.getElementById('search-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    showError(message) {
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            
            // Hide all steps
            document.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
            });
            
            errorSection.style.display = 'block';
            errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    restart() {
        // Reset state but keep the found restaurants
        this.selectedRestaurant = null;
        this.isProcessing = false;
        
        // Clear map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Reset form
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = '';
        }
        
        // Show first step
        this.showStep('address');
        
        // Focus on address input
        setTimeout(() => {
            if (addressInput) {
                addressInput.focus();
            }
        }, 100);
    }

    openGoogleMaps() {
        if (!this.selectedRestaurant) return;
        
        const lat = this.selectedRestaurant.lat;
        const lng = this.selectedRestaurant.lng;
        const name = encodeURIComponent(this.selectedRestaurant.name);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${name}@${lat},${lng}`;
        
        window.open(mapsUrl, '_blank');
    }
}

// Handle window resize for mobile/desktop switching
window.addEventListener('resize', function() {
    const isMobile = window.innerWidth < 768;
    if (window.restaurantSelector) {
        window.restaurantSelector.isMobile = isMobile;
        
        if (isMobile) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }
});