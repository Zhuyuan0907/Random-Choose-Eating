// Restaurant Selector App - Streamlined Version
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
                }).filter(restaurant => restaurant !== null && restaurant.name !== '未知餐廳')
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