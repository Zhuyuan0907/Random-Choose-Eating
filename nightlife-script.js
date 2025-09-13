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
                    this.isBeerMode = true;
                    this.peopleCount = 4; // Default for beer mode
                } else {
                    this.isBeerMode = false;
                    this.peopleCount = parseInt(count);
                }
                
                if (peopleInput) {
                    peopleInput.value = this.peopleCount;
                }
                
                this.updatePeopleButtons();
            });
        });
        
        const rerollBtn = document.getElementById('reroll');
        const startOver = document.getElementById('start-over');
        const viewOnGoogle = document.getElementById('view-on-google');
        const retryBtn = document.getElementById('retry-btn');
        
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => this.performRandomSelection());
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
                phone: '02-2311-8832'
            },
            {
                name: 'Brass Monkey 銅猴子酒吧',
                lat: 25.0425,
                lng: 121.5148,
                distance: this.calculateDistance(25.0425, 121.5148, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'bar',
                cuisine: 'cocktails',
                address: '台北市中正區臨沂街27巷1號'
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
        
        // Add some known late-night venues
        this.venues = [
            {
                name: '海底撈火鍋台北西門店',
                lat: 25.0420,
                lng: 121.5087,
                distance: this.calculateDistance(25.0420, 121.5087, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'restaurant',
                cuisine: 'hot_pot',
                address: '台北市萬華區中華路一段114號'
            },
            {
                name: '鼎泰豐台北車站店',
                lat: 25.0478,
                lng: 121.5171,
                distance: this.calculateDistance(25.0478, 121.5171, this.fixedLocation.lat, this.fixedLocation.lng),
                amenity: 'restaurant',
                cuisine: 'taiwanese',
                address: '台北市中正區北平西路3號'
            }
        ];
        
        try {
            await this.searchOverpassVenues(['restaurant', 'bar', 'pub', 'cafe']);
        } catch (error) {
            console.warn('Overpass search failed, using fallback venues');
        }
        
        this.venues = this.venues.filter(venue => venue.distance <= radius);
        this.updateSearchStatus(`找到 ${this.venues.length} 個適合續攤的地點`);
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
            'food_court': '美食廣場'
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
            'burger': '漢堡',
            'coffee': '咖啡輕食',
            'dessert': '甜點',
            'various': '多元料理',
            'asian': '亞洲料理',
            'international': '國際料理',
            'beer': '啤酒',
            'cocktails': '調酒',
            'wine': '紅酒'
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
                    ${venue.address ? `<div class="detail">地址：${venue.address}</div>` : ''}
                    ${venue.phone ? `<div class="detail">電話：${venue.phone}</div>` : ''}
                </div>
            `;
        }
        
        this.initializeMap(venue);
        this.showStep('result');
    }

    initializeMap(venue) {
        if (!this.isMobile) {
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${window.NIGHTLIFE_CONFIG?.MAP?.GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(venue.name + ' ' + (venue.address || ''))}&center=${venue.lat},${venue.lng}&zoom=16`;
                mapContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
            }
        }
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