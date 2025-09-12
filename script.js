// Restaurant Selector App - OpenSource Version
class RestaurantSelector {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.selectedTime = '18:00';
        this.restaurants = [];
        this.currentStep = 'address';
        this.isSpinning = false;
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
        this.currentNominatimAPI = 0;
        this.currentOverpassAPI = 0;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTimeDisplay();
        
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
        
        addressInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAddress();
            }
        });
        
        addressSubmit?.addEventListener('click', () => this.submitAddress());

        // Time selection
        const timeInput = document.getElementById('meal-time');
        const timeButtons = document.querySelectorAll('.time-btn');
        const timeSubmit = document.getElementById('time-submit');

        timeInput?.addEventListener('change', (e) => {
            this.selectedTime = e.target.value;
            this.updateTimeButtons();
        });

        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = e.target.dataset.time;
                this.selectedTime = time;
                timeInput.value = time;
                this.updateTimeButtons();
            });
        });

        timeSubmit?.addEventListener('click', () => this.searchRestaurants());

        // Restaurant selection
        const startRandom = document.getElementById('start-random');
        const reroll = document.getElementById('reroll');

        startRandom?.addEventListener('click', () => this.startRandomSelection());
        reroll?.addEventListener('click', () => this.startRandomSelection());

        // Result actions
        const viewOnOSM = document.getElementById('view-on-osm');
        const viewOnGoogle = document.getElementById('view-on-google');
        const startOver = document.getElementById('start-over');

        viewOnOSM?.addEventListener('click', () => this.openOSMMap());
        viewOnGoogle?.addEventListener('click', () => this.openGoogleMaps());
        startOver?.addEventListener('click', () => this.restart());

        // Error retry
        const retryBtn = document.getElementById('retry-btn');
        retryBtn?.addEventListener('click', () => this.restart());
    }


    async submitAddress() {
        const addressInput = document.getElementById('address-input');
        const address = addressInput.value.trim();
        
        if (!address) {
            this.showError('請輸入有效的地址');
            return;
        }

        this.showLoading('address-loading');

        try {
            const location = await this.geocodeAddress(address);
            this.userLocation = location;
            
            this.hideLoading('address-loading');
            this.showStep('time');
            
        } catch (error) {
            this.hideLoading('address-loading');
            this.showError('無法找到該地址，請檢查後重新輸入');
            console.error('Geocoding error:', error);
        }
    }

    async geocodeAddress(address) {
        // Try multiple variations of the address
        const addressVariations = [
            address,
            `${address}, 台灣`,
            `${address}, Taiwan`,
            address.replace(/縣|市|區|鎮|里/g, ''), // Remove common location suffixes
            address.replace(/路|街|巷|號/g, '') // Remove street indicators
        ];

        for (let apiIndex = 0; apiIndex < this.nominatimAPIs.length; apiIndex++) {
            const nominatimAPI = this.nominatimAPIs[apiIndex];
            
            for (const addressVar of addressVariations) {
                try {
                    console.log(`Trying: ${addressVar} on ${nominatimAPI}`);
                    
                    const url = `${nominatimAPI}/search?format=json&q=${encodeURIComponent(addressVar)}&limit=3&accept-language=zh-TW,zh,en&countrycodes=tw`;
                    
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'RestaurantSelector/1.0'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        const result = data[0];
                        console.log(`Found: ${result.display_name}`);
                        
                        return {
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon),
                            address: result.display_name
                        };
                    }
                    
                    // Wait a bit between requests to be nice to the API
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    console.warn(`Failed ${addressVar} on ${nominatimAPI}:`, error.message);
                    continue;
                }
            }
        }
        
        // If all attempts failed, try a broader search without country restriction
        try {
            console.log('Trying broader search...');
            const url = `${this.nominatimAPIs[0]}/search?format=json&q=${encodeURIComponent(address)}&limit=5&accept-language=zh-TW,zh,en`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'RestaurantSelector/1.0'
                }
            });
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                // Prefer results in Taiwan
                const taiwanResult = data.find(r => 
                    r.display_name.includes('台灣') || 
                    r.display_name.includes('Taiwan') ||
                    r.display_name.includes('臺灣')
                );
                
                const result = taiwanResult || data[0];
                console.log(`Broader search found: ${result.display_name}`);
                
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    address: result.display_name
                };
            }
        } catch (error) {
            console.error('Broader search failed:', error);
        }
        
        throw new Error('找不到該地址，請嘗試更具體的地名，例如：台北車站、高雄火車站');
    }

    updateTimeButtons() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.time === this.selectedTime);
        });
    }

    updateTimeDisplay() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Set default time based on current time
        let defaultTime = '18:00';
        if (currentHour >= 17) {
            const nextHour = Math.min(currentHour + 1, 21);
            defaultTime = `${nextHour.toString().padStart(2, '0')}:00`;
        }
        
        this.selectedTime = defaultTime;
        const timeInput = document.getElementById('meal-time');
        if (timeInput) {
            timeInput.value = defaultTime;
        }
        this.updateTimeButtons();
    }

    async searchRestaurants() {
        if (!this.userLocation) {
            this.showError('請先確認你的位置');
            return;
        }

        this.showStep('search');
        this.updateSearchStatus('正在搜尋附近餐廳...');

        try {
            const restaurants = await this.findNearbyRestaurants();
            this.updateSearchStatus(`找到 ${restaurants.length} 家餐廳，正在篩選...`);
            
            if (restaurants.length === 0) {
                this.showError('找不到附近的餐廳，請嘗試其他地點');
                return;
            }

            // Simple filtering by time (basic assumption about operating hours)
            const openRestaurants = this.filterRestaurantsByTime(restaurants);
            
            if (openRestaurants.length === 0) {
                this.showError('找不到在此時間可能營業的餐廳，請嘗試其他時間');
                return;
            }

            this.restaurants = openRestaurants;
            this.showStep('select');
            this.setupRestaurantRoulette();
            
        } catch (error) {
            console.error('Restaurant search error:', error);
            this.showError('搜尋餐廳時發生錯誤，請稍後再試');
        }
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
                }).filter(restaurant => restaurant !== null && restaurant.name !== '未知餐廳')
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, window.CONFIG?.SEARCH?.MAX_RESULTS || 20);

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
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        return restaurants.filter(restaurant => {
            // If no opening hours data, assume it might be open
            if (!restaurant.opening_hours) {
                return true;
            }

            // Basic opening hours parsing (simplified)
            return this.isRestaurantOpenBasic(restaurant.opening_hours, selectedTime, dayOfWeek);
        });
    }

    isRestaurantOpenBasic(openingHours, selectedTime, dayOfWeek) {
        // Very basic parsing of opening hours
        // This is simplified - real parsing would be much more complex
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

    setupRestaurantRoulette() {
        const restaurantCard = document.getElementById('current-restaurant');
        const restaurantName = restaurantCard.querySelector('.restaurant-name');
        const restaurantInfo = restaurantCard.querySelector('.restaurant-info');

        restaurantName.textContent = `找到 ${this.restaurants.length} 家餐廳`;
        restaurantInfo.textContent = '準備開始選擇...';
    }

    async startRandomSelection() {
        if (this.isSpinning || this.restaurants.length === 0) return;

        this.isSpinning = true;
        const restaurantCard = document.getElementById('current-restaurant');
        const startButton = document.getElementById('start-random');
        const rerollButton = document.getElementById('reroll');

        startButton.style.display = 'none';
        rerollButton.style.display = 'none';
        
        restaurantCard.classList.add('spinning');

        // Show random restaurants during animation
        const animationDuration = window.CONFIG?.ANIMATION?.ROULETTE_DURATION || 2000;
        const intervalTime = window.CONFIG?.ANIMATION?.CARD_SPIN_INTERVAL || 100;
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
                this.updateRestaurantCard(selectedRestaurant);
                
                setTimeout(() => {
                    restaurantCard.classList.remove('spinning');
                    restaurantCard.classList.add('highlighting');
                    
                    setTimeout(() => {
                        restaurantCard.classList.remove('highlighting');
                        this.showFinalResult(selectedRestaurant);
                        this.isSpinning = false;
                    }, window.CONFIG?.ANIMATION?.HIGHLIGHT_DURATION || 1000);
                }, 500);
            }
        }, intervalTime);
    }

    updateRestaurantCard(restaurant) {
        const restaurantCard = document.getElementById('current-restaurant');
        const restaurantName = restaurantCard.querySelector('.restaurant-name');
        const restaurantInfo = restaurantCard.querySelector('.restaurant-info');

        restaurantName.textContent = restaurant.name;
        
        const cuisine = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : '';
        const distance = `📍 ${(restaurant.distance / 1000).toFixed(1)}km`;
        const amenity = this.getAmenityIcon(restaurant.amenity);
        
        restaurantInfo.innerHTML = `
            <div>${amenity} ${cuisine}</div>
            <div style="font-size: 0.8rem; opacity: 0.7;">${distance}</div>
        `;
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
        
        const cuisine = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : '';
        const distance = `📍 ${(restaurant.distance / 1000).toFixed(1)}km`;
        const amenityIcon = this.getAmenityIcon(restaurant.amenity);
        
        resultContainer.innerHTML = `
            <div class="name">${restaurant.name}</div>
            <div class="details">
                <div class="detail">${amenityIcon} ${restaurant.amenity}</div>
                <div class="detail">${cuisine}</div>
                <div class="detail">${distance}</div>
                <div class="detail">🕒 選擇時間: ${this.selectedTime}</div>
                ${restaurant.address ? `<div class="detail">📍 ${restaurant.address}</div>` : ''}
                ${restaurant.phone ? `<div class="detail">📞 ${restaurant.phone}</div>` : ''}
            </div>
        `;

        // Load map on desktop
        if (!this.isMobile) {
            this.initializeMap(restaurant.lat, restaurant.lng, restaurant);
        }

        this.showStep('result');
        
        // Show reroll button after result
        setTimeout(() => {
            document.getElementById('reroll').style.display = 'inline-flex';
        }, 1000);
    }

    initializeMap(lat, lng, restaurant) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;

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
        // Reset state
        this.userLocation = null;
        this.restaurants = [];
        this.selectedRestaurant = null;
        this.isSpinning = false;
        
        // Clear map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Reset form
        document.getElementById('address-input').value = '';
        this.updateTimeDisplay();
        
        // Reset buttons
        document.getElementById('start-random').style.display = 'inline-flex';
        document.getElementById('reroll').style.display = 'none';
        
        // Show first step
        this.showStep('address');
        
        // Focus on address input
        setTimeout(() => {
            document.getElementById('address-input').focus();
        }, 100);
    }

    openOSMMap() {
        if (!this.selectedRestaurant) return;
        
        const lat = this.selectedRestaurant.lat;
        const lng = this.selectedRestaurant.lng;
        const osmUrl = `https://www.openstreetmap.org/#map=16/${lat}/${lng}`;
        
        window.open(osmUrl, '_blank');
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