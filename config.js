// Configuration for SITCON Organizer Restaurant Selector
// No API keys required - uses free OpenSource APIs

const CONFIG = {
    // Search radius in meters (default: 2000m = 2km)
    SEARCH_RADIUS: 2000,
    
    // Fixed location: Mozilla Community Space Taipei (台北市中正區重慶南路一段99號)
    FIXED_LOCATION: {
        lat: 25.0465,
        lng: 121.5155,
        name: 'Mozilla Community Space Taipei',
        address: '台北市中正區重慶南路一段99號1105室'
    },
    
    // Animation durations in milliseconds
    ANIMATION: {
        ROULETTE_DURATION: 2000,
        HIGHLIGHT_DURATION: 1000,
        CARD_SPIN_INTERVAL: 100
    },
    
    // Restaurant search preferences
    SEARCH: {
        // Types of places to search for (OpenStreetMap amenity types)
        PLACE_TYPES: ['restaurant', 'fast_food', 'cafe', 'food_court'],
        // Maximum results to process
        MAX_RESULTS: 20,
        // Search timeout in seconds
        TIMEOUT: 25,
        // People-based filtering
        PEOPLE_GROUPS: {
            small: { min: 1, max: 5, preferredTypes: ['cafe', 'fast_food', 'restaurant'] },
            medium: { min: 6, max: 15, preferredTypes: ['restaurant', 'cafe'] },
            large: { min: 16, max: 50, preferredTypes: ['restaurant', 'food_court'] }
        }
    },
    
    // API endpoints (free and open)
    APIS: {
        // Nominatim for geocoding (address search)
        NOMINATIM: 'https://nominatim.openstreetmap.org',
        // Overpass API for OpenStreetMap data queries
        OVERPASS: 'https://overpass-api.de/api/interpreter',
        // Alternative Overpass APIs (in case main one is down)
        OVERPASS_ALTERNATIVES: [
            'https://overpass.kumi.systems/api/interpreter',
            'https://z.overpass-api.de/api/interpreter'
        ]
    },
    
    // Map configuration
    MAP: {
        // Default zoom level
        ZOOM: 16,
        // Google Maps API Key (optional - leave empty to use basic embed without API key)
        // Get your API key from: https://developers.google.com/maps/documentation/embed/get-api-key
        GOOGLE_MAPS_API_KEY: '',
        // Map display mode
        MODE: 'google' // 'google' for Google Maps, 'osm' for OpenStreetMap (deprecated)
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}