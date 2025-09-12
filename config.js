// Google Maps API Configuration
// This file handles both local development and production deployment

const CONFIG = {
    // Your Google Maps API Key
    // For local development: Replace 'YOUR_API_KEY_HERE' with your actual API key
    // For Cloudflare Pages: Set GOOGLE_MAPS_API_KEY environment variable
    GOOGLE_MAPS_API_KEY: typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
    
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
        // Types of places to search for
        PLACE_TYPES: ['restaurant', 'meal_takeaway', 'food'],
        // Minimum rating threshold (0-5, 0 = no filter)
        MIN_RATING: 0,
        // Maximum results to process
        MAX_RESULTS: 20
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