// Restaurant Selector App
class RestaurantSelector {
    constructor() {
        this.map = null;
        this.geocoder = null;
        this.placesService = null;
        this.userLocation = null;
        this.selectedTime = '18:00';
        this.restaurants = [];
        this.currentStep = 'address';
        this.isSpinning = false;
        this.isMobile = window.innerWidth < 768;
        
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
        const viewOnMaps = document.getElementById('view-on-maps');
        const startOver = document.getElementById('start-over');

        viewOnMaps?.addEventListener('click', () => this.openGoogleMaps());
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
            // Initialize geocoder if not already done
            if (!this.geocoder) {
                this.geocoder = new google.maps.Geocoder();
            }

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

    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK') {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        address: results[0].formatted_address
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
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
            // Initialize Places service if not already done
            if (!this.placesService) {
                const mapDiv = document.createElement('div');
                const map = new google.maps.Map(mapDiv);
                this.placesService = new google.maps.places.PlacesService(map);
            }

            const restaurants = await this.findNearbyRestaurants();
            this.updateSearchStatus('正在檢查營業時間...');
            
            const openRestaurants = await this.filterOpenRestaurants(restaurants);
            
            if (openRestaurants.length === 0) {
                this.showError('找不到在此時間營業的餐廳，請嘗試其他時間');
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

    findNearbyRestaurants() {
        return new Promise((resolve, reject) => {
            const request = {
                location: new google.maps.LatLng(this.userLocation.lat, this.userLocation.lng),
                radius: 2000, // 2km radius
                type: ['restaurant', 'meal_takeaway', 'food'],
                openNow: false // We'll filter manually for more control
            };

            this.placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
    }

    async filterOpenRestaurants(restaurants) {
        const openRestaurants = [];
        const selectedTime = this.parseTime(this.selectedTime);
        const dayOfWeek = new Date().getDay();

        for (const restaurant of restaurants) {
            try {
                const details = await this.getPlaceDetails(restaurant.place_id);
                
                if (this.isRestaurantOpen(details, selectedTime, dayOfWeek)) {
                    openRestaurants.push({
                        ...restaurant,
                        details: details
                    });
                }
            } catch (error) {
                console.warn(`Failed to get details for ${restaurant.name}:`, error);
                // Include restaurant without detailed hours check
                openRestaurants.push(restaurant);
            }
        }

        return openRestaurants;
    }

    getPlaceDetails(placeId) {
        return new Promise((resolve, reject) => {
            const request = {
                placeId: placeId,
                fields: ['name', 'opening_hours', 'formatted_address', 'rating', 'price_level', 'photos', 'geometry']
            };

            this.placesService.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else {
                    reject(new Error(`Place details failed: ${status}`));
                }
            });
        });
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes; // Convert to minutes
    }

    isRestaurantOpen(details, selectedTime, dayOfWeek) {
        if (!details.opening_hours || !details.opening_hours.periods) {
            return true; // If no hours data, assume it might be open
        }

        const periods = details.opening_hours.periods;
        
        for (const period of periods) {
            if (period.open && period.open.day === dayOfWeek) {
                const openTime = period.open.time ? this.parseGoogleTime(period.open.time) : 0;
                const closeTime = period.close ? 
                    this.parseGoogleTime(period.close.time) : 
                    24 * 60; // If no close time, assume open all day

                // Handle overnight restaurants (close time on next day)
                if (closeTime < openTime) {
                    return selectedTime >= openTime || selectedTime <= closeTime;
                } else {
                    return selectedTime >= openTime && selectedTime <= closeTime;
                }
            }
        }

        return false;
    }

    parseGoogleTime(timeString) {
        if (!timeString || timeString.length !== 4) return 0;
        const hours = parseInt(timeString.substr(0, 2));
        const minutes = parseInt(timeString.substr(2, 2));
        return hours * 60 + minutes;
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
        const animationDuration = 2000;
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
                this.updateRestaurantCard(selectedRestaurant);
                
                setTimeout(() => {
                    restaurantCard.classList.remove('spinning');
                    restaurantCard.classList.add('highlighting');
                    
                    setTimeout(() => {
                        restaurantCard.classList.remove('highlighting');
                        this.showFinalResult(selectedRestaurant);
                        this.isSpinning = false;
                    }, 1000);
                }, 500);
            }
        }, intervalTime);
    }

    updateRestaurantCard(restaurant) {
        const restaurantCard = document.getElementById('current-restaurant');
        const restaurantName = restaurantCard.querySelector('.restaurant-name');
        const restaurantInfo = restaurantCard.querySelector('.restaurant-info');

        restaurantName.textContent = restaurant.name;
        
        const rating = restaurant.rating ? `⭐ ${restaurant.rating}` : '';
        const priceLevel = this.getPriceLevel(restaurant.price_level);
        const vicinity = restaurant.vicinity || '';
        
        restaurantInfo.innerHTML = `
            <div>${rating} ${priceLevel}</div>
            <div style="font-size: 0.8rem; opacity: 0.7;">${vicinity}</div>
        `;
    }

    getPriceLevel(priceLevel) {
        if (typeof priceLevel !== 'number') return '';
        
        const levels = {
            0: '💰',
            1: '💰',
            2: '💰💰',
            3: '💰💰💰',
            4: '💰💰💰💰'
        };
        
        return levels[priceLevel] || '';
    }

    showFinalResult(restaurant) {
        this.selectedRestaurant = restaurant;
        const resultContainer = document.getElementById('final-restaurant');
        
        const rating = restaurant.rating ? `⭐ ${restaurant.rating}` : '';
        const priceLevel = this.getPriceLevel(restaurant.price_level);
        
        resultContainer.innerHTML = `
            <div class="name">${restaurant.name}</div>
            <div class="details">
                <div class="detail">📍 ${restaurant.vicinity || ''}</div>
                <div class="detail">${rating} ${priceLevel}</div>
                <div class="detail">🕒 選擇時間: ${this.selectedTime}</div>
            </div>
        `;

        // Setup Google Maps link
        const viewOnMaps = document.getElementById('view-on-maps');
        const lat = restaurant.geometry.location.lat();
        const lng = restaurant.geometry.location.lng();
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`;
        
        viewOnMaps.onclick = () => window.open(mapsUrl, '_blank');

        // Load map on desktop
        if (!this.isMobile) {
            this.initializeMap(lat, lng, restaurant);
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

        const map = new google.maps.Map(mapContainer, {
            center: { lat: lat, lng: lng },
            zoom: 16,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            title: restaurant.name,
            animation: google.maps.Animation.BOUNCE
        });

        // Stop marker animation after 2 seconds
        setTimeout(() => {
            const markers = map.getMarkers?.() || [];
            markers.forEach(marker => marker.setAnimation(null));
        }, 2000);
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

    openGoogleMaps() {
        if (!this.selectedRestaurant) return;
        
        const lat = this.selectedRestaurant.geometry.location.lat();
        const lng = this.selectedRestaurant.geometry.location.lng();
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.selectedRestaurant.name)}&query_place_id=${this.selectedRestaurant.place_id}`;
        
        window.open(mapsUrl, '_blank');
    }
}

// Initialize Google Maps callback
function initMap() {
    // This function is called when Google Maps API is loaded
    window.restaurantSelector = new RestaurantSelector();
}

// Handle API loading errors
window.gm_authFailure = function() {
    console.error('Google Maps API authentication failed');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    if (errorSection && errorMessage) {
        errorMessage.textContent = 'Google Maps API 認證失敗，請檢查 API 金鑰設定';
        document.querySelectorAll('.step').forEach(step => step.style.display = 'none');
        errorSection.style.display = 'block';
    }
};

// Initialize app when DOM is ready (fallback if Google Maps fails)
document.addEventListener('DOMContentLoaded', function() {
    // If Google Maps API hasn't loaded after 5 seconds, show error
    setTimeout(() => {
        if (typeof google === 'undefined') {
            const errorSection = document.getElementById('error-section');
            const errorMessage = document.getElementById('error-message');
            
            if (errorSection && errorMessage && !window.restaurantSelector) {
                errorMessage.textContent = '無法載入 Google Maps API，請檢查網路連線或 API 設定';
                document.querySelectorAll('.step').forEach(step => step.style.display = 'none');
                errorSection.style.display = 'block';
            }
        }
    }, 5000);
});

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