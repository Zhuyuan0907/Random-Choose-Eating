// Configuration for Restaurant Selector App
// No API keys required - uses free OpenSource APIs

const CONFIG = {
    // Search radius in meters (default: 2000m = 2km)
    SEARCH_RADIUS: 2000,
    
    // Default coordinates for fallback (台北車站)
    DEFAULT_LOCATION: {
        lat: 25.0478,
        lng: 121.5168
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
        TIMEOUT: 25
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
        // Tile server for OpenStreetMap
        TILE_SERVER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        // Attribution text
        ATTRIBUTION: '© OpenStreetMap contributors'
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