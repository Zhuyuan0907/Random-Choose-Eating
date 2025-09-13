// Configuration for SITCON Organizer Nightlife/Late Night Selector
// No API keys required - uses free OpenSource APIs

const NIGHTLIFE_CONFIG = {
    // Search radius in meters (expanded for nightlife venues)
    SEARCH_RADIUS: 1200,
    
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
    
    // Nightlife venue search preferences
    SEARCH: {
        // Types of places to search for (OpenStreetMap amenity types)
        PLACE_TYPES: ['restaurant', 'bar', 'pub', 'cafe', 'fast_food'],
        // Special types for beer mode
        BEER_TYPES: ['bar', 'pub', 'brewery'],
        // Maximum results to process
        MAX_RESULTS: 25,
        // Search timeout in seconds
        TIMEOUT: 25,
        // People-based filtering for nightlife
        PEOPLE_GROUPS: {
            small: { min: 1, max: 3, preferredTypes: ['bar', 'pub', 'cafe', 'restaurant'] },
            medium: { min: 4, max: 8, preferredTypes: ['restaurant', 'bar', 'pub'] },
            large: { min: 9, max: 30, preferredTypes: ['restaurant', 'pub'] }
        },
        // Cuisine preferences for late night
        LATE_NIGHT_CUISINES: ['taiwanese', 'japanese', 'korean', 'chinese', 'thai', 'various']
    },
    
    // API endpoints (free and open)
    APIS: {
        // Nominatim for geocoding (address search)
        NOMINATIM: 'https://nominatim.openstreetmap.org',
        // Overpass API for OpenStreetMap data queries
        OVERPASS: 'https://overpass-api.de/api/interpreter',
        // Alternative Overpass APIs (in case main one is down)
        OVERPASS_ALTERNATIVES: [
            'https://z.overpass-api.de/api/interpreter',
            'https://lz4.overpass-api.de/api/interpreter'
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
    },
    
    // Nightlife specific settings
    NIGHTLIFE: {
        // Preferred hours for nightlife (24-hour format)
        PREFERRED_HOURS: {
            start: 21, // 9 PM
            end: 2     // 2 AM (next day)
        },
        // Venue categories with Chinese translations
        VENUE_CATEGORIES: {
            'bar': '酒吧',
            'pub': '酒館',
            'brewery': '啤酒屋',
            'restaurant': '餐廳',
            'cafe': '咖啡廳',
            'fast_food': '速食',
            'nightclub': '夜店'
        }
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.NIGHTLIFE_CONFIG = NIGHTLIFE_CONFIG;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NIGHTLIFE_CONFIG;
}