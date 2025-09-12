// Configuration Example for Restaurant Selector App
// This app uses completely FREE and OPEN APIs - no API keys needed!

const CONFIG = {
    // Search radius in meters (default: 2000m = 2km)
    // You can adjust this value to search wider or narrower areas
    SEARCH_RADIUS: 2000,
    
    // Default coordinates for fallback (Taipei Main Station)
    // Change these to your preferred default location
    DEFAULT_LOCATION: {
        lat: 25.0478,  // Latitude
        lng: 121.5168  // Longitude
    },
    
    // Animation durations in milliseconds
    // Adjust these to make animations faster or slower
    ANIMATION: {
        ROULETTE_DURATION: 2000,     // How long the roulette spins
        HIGHLIGHT_DURATION: 1000,    // How long the final selection highlights
        CARD_SPIN_INTERVAL: 100      // How fast cards change during animation
    },
    
    // Restaurant search preferences
    SEARCH: {
        // Types of places to search for (OpenStreetMap amenity types)
        // You can add or remove types as needed
        PLACE_TYPES: ['restaurant', 'fast_food', 'cafe', 'food_court'],
        
        // Maximum number of results to process (higher = more variety but slower)
        MAX_RESULTS: 20,
        
        // Search timeout in seconds (increase if searches are timing out)
        TIMEOUT: 25
    },
    
    // API endpoints - all completely free!
    APIS: {
        // Nominatim for geocoding (converting addresses to coordinates)
        NOMINATIM: 'https://nominatim.openstreetmap.org',
        
        // Primary Overpass API for restaurant data
        OVERPASS: 'https://overpass-api.de/api/interpreter',
        
        // Backup Overpass APIs (in case the primary is down)
        OVERPASS_ALTERNATIVES: [
            'https://overpass.kumi.systems/api/interpreter',
            'https://z.overpass-api.de/api/interpreter'
        ]
    },
    
    // Map display configuration
    MAP: {
        // Default zoom level (16 is good for restaurants, lower = more zoomed out)
        ZOOM: 16,
        
        // Map tile server (you can use other OpenStreetMap tile servers)
        TILE_SERVER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        
        // Attribution text (required by OpenStreetMap)
        ATTRIBUTION: '© OpenStreetMap contributors'
    }
};

// Make config available globally
window.CONFIG = CONFIG;