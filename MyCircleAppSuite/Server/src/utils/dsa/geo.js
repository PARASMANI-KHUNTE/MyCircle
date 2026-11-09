/**
 * High-performance Geospatial Math using spherical trigonometry.
 * Earth mean radius = 6371.0088 kilometers.
 */
const EARTH_RADIUS_KM = 6371.0088;
const DEG_TO_RAD = Math.PI / 180.0;

/**
 * Calculates geodesic distance between two [lng, lat] coordinates in meters
 * using the Haversine formula (accurate and fast O(1)).
 */
const calculateHaversineDistance = (coordsA, coordsB) => {
    if (!coordsA || !coordsB || coordsA.length < 2 || coordsB.length < 2) {
        return null;
    }

    const [lon1, lat1] = coordsA;
    const [lon2, lat2] = coordsB;

    const dLat = (lat2 - lat1) * DEG_TO_RAD;
    const dLon = (lon2 - lon1) * DEG_TO_RAD;

    const lat1Rad = lat1 * DEG_TO_RAD;
    const lat2Rad = lat2 * DEG_TO_RAD;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    return (EARTH_RADIUS_KM * c) * 1000;
};

/**
 * Formats a metric distance into clean user-facing string.
 */
const formatDistance = (meters) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) {
        return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
};

module.exports = {
    calculateHaversineDistance,
    formatDistance,
};
