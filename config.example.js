// Google Maps API Configuration
// Copy this file to config.js and add your API key

const CONFIG = {
    // Your Google Maps API Key
    // Get it from: https://console.cloud.google.com/google/maps-apis/
    GOOGLE_MAPS_API_KEY: 'AIzaSyBB1-vbaxBsbA86zazorEtzUiyDpE8DrKM',
    
    // Search radius in meters (default: 2000m = 2km)
    SEARCH_RADIUS: 2000,
    
    // Default coordinates for fallback (Taipei 101)
    DEFAULT_LOCATION: {
        lat: 25.0330,
        lng: 121.5654
    },
    
    // Animation durations in milliseconds
    ANIMATION: {
        ROULETTE_DURATION: 2000,
        HIGHLIGHT_DURATION: 1000,
        CARD_SPIN_INTERVAL: 100
    }
};

// Make config available globally
window.CONFIG = CONFIG;