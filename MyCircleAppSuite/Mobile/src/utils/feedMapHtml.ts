import {
    DARK_TILE_URL,
    LABELS_TILE_URL,
    LIGHT_TILE_URL,
    MAP_ATTRIBUTION,
    MAP_MAX_NATIVE_ZOOM,
} from '../constants/mapTiles';
import { serializeForInlineScript } from './webViewScript';

export interface FeedMapPost {
    _id: string;
    fuzzedLat: number;
    fuzzedLng: number;
    type?: string;
    price?: string | number;
    title?: string;
}

export interface BuildFeedMapHtmlOptions {
    background: string;
    isDark: boolean;
    userLocation?: { lat: number; lng: number } | null;
    posts: FeedMapPost[];
    distanceRadius: number;
}

const getMarkerColor = (type?: string) => {
    if (type === 'job') return '#3b82f6';
    if (type === 'service') return '#06b6d4';
    if (type === 'sell') return '#f59e0b';
    if (type === 'rent') return '#8b5cf6';
    return '#ec4899';
};

export const buildFeedMapHtml = ({
    background,
    isDark,
    userLocation,
    posts,
    distanceRadius,
}: BuildFeedMapHtmlOptions) => {
    const config = {
        userLocation: userLocation || null,
        posts: posts.map((post) => ({
            id: post._id,
            lat: post.fuzzedLat,
            lng: post.fuzzedLng,
            type: post.type,
            price: post.price,
            title: post.title,
            color: getMarkerColor(post.type),
        })),
        mapStyle: isDark ? DARK_TILE_URL : LIGHT_TILE_URL,
        labelsTile: LABELS_TILE_URL,
        attribution: MAP_ATTRIBUTION,
        maxNativeZoom: MAP_MAX_NATIVE_ZOOM,
        maxZoom: 19,
        distanceRadius,
    };

    return `
    <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
                <style>
                    body {margin: 0; padding: 0; background-color: ${background}; }
                    #map {height: 100vh; width: 100vw; }
                    .leaflet-container {background: ${background}; }

                    @keyframes pulse {
                        0% { transform: scale(0.5); opacity: 1; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                    .user-loc-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .user-loc-dot {
                        width: 14px;
                        height: 14px;
                        background: #8b5cf6;
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 2;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    }
                    .user-loc-pulse {
                        position: absolute;
                        width: 30px;
                        height: 30px;
                        background: rgba(139, 92, 246, 0.4);
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                        z-index: 1;
                    }

                    @keyframes markerEntrance {
                        0% { transform: scale(0); opacity: 0; }
                        60% { transform: scale(1.2); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .custom-marker {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        animation: markerEntrance 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                    }
                    .marker-glass {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 4px 10px;
                        border-radius: 12px;
                        color: white;
                        font-family: sans-serif;
                        font-weight: bold;
                        font-size: 12px;
                        white-space: nowrap;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        border-bottom: 2px solid var(--marker-color);
                        transition: all 0.2s ease;
                    }
                    .custom-marker:hover .marker-glass {
                        transform: translateY(-2px);
                        background: rgba(255, 255, 255, 0.2);
                    }
                    .marker-tail {
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 6px solid var(--marker-color);
                        margin-top: -1px;
                        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
                    }
                    .marker-price {
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    }

                    /* Locate Me Button */
                    .locate-me-btn {
                        position: absolute;
                        bottom: 180px; /* Above the bottom sheet if open */
                        right: 20px;
                        width: 44px;
                        height: 44px;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.2s ease;
                        cursor: pointer;
                    }
                    .locate-me-btn:active {
                        transform: scale(0.9);
                        background: rgba(139, 92, 246, 0.3);
                    }
                    .locate-icon {
                        width: 20px;
                        height: 20px;
                        border: 2px solid white;
                        border-radius: 50%;
                        position: relative;
                    }
                    .locate-icon::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                    }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <div class="locate-me-btn" onclick="recenterMap()">
                    <div class="locate-icon"></div>
                </div>
                <script>
                    var config = ${serializeForInlineScript(config)};
                    var userLoc = config.userLocation;
                    var defaultCenter = [28.6139, 77.2090];
                    var center = userLoc ? [userLoc.lat, userLoc.lng] : defaultCenter;

                    var map = L.map('map', {zoomControl: false, zoomSnap: 0.1 }).setView(center, userLoc ? 15.5 : 12);

                    window.recenterMap = function() {
                        if (userLoc) {
                            map.flyTo([userLoc.lat, userLoc.lng], 16.5, {
                                animate: true,
                                duration: 1.5,
                                easeLinearity: 0.25
                            });
                        } else {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestLocation' }));
                        }
                    };

                    L.tileLayer(config.mapStyle, {
                        attribution: config.attribution,
                        maxNativeZoom: config.maxNativeZoom,
                        maxZoom: config.maxZoom
                    }).addTo(map);
                    L.tileLayer(config.labelsTile, {
                        maxNativeZoom: config.maxNativeZoom,
                        maxZoom: config.maxZoom
                    }).addTo(map);

                    if (userLoc) {
                        var userIcon = L.divIcon({
                            className: 'user-loc-container',
                            html: '<div class="user-loc-pulse"></div><div class="user-loc-dot"></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        L.marker([userLoc.lat, userLoc.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

                        L.circle([userLoc.lat, userLoc.lng], {
                            radius: config.distanceRadius * 1000,
                            fillColor: '#8b5cf6',
                            color: '#8b5cf6',
                            weight: 1,
                            opacity: 0.2,
                            fillOpacity: 0.05
                        }).addTo(map);
                    }

                    var bounds = [];
                    if (userLoc) bounds.push([userLoc.lat, userLoc.lng]);

                    config.posts.forEach(function(p, index) {
                        bounds.push([p.lat, p.lng]);

                        var markerElement = document.createElement('div');
                        markerElement.className = 'custom-marker';
                        markerElement.style.setProperty('--marker-color', p.color);
                        markerElement.style.animationDelay = Math.min(index * 100, 600) + 'ms';

                        var glass = document.createElement('div');
                        glass.className = 'marker-glass';
                        var price = document.createElement('span');
                        price.className = 'marker-price';
                        price.textContent = '₹' + p.price;
                        glass.appendChild(price);
                        var tail = document.createElement('div');
                        tail.className = 'marker-tail';
                        markerElement.appendChild(glass);
                        markerElement.appendChild(tail);

                        var markerIcon = L.divIcon({
                            className: 'custom-marker-wrapper',
                            html: markerElement,
                            iconSize: [60, 30],
                            iconAnchor: [30, 30]
                        });

                        var marker = L.marker([p.lat, p.lng], { icon: markerIcon }).addTo(map);
                        marker.on('click', function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', postId: p.id }));
                            map.flyTo([p.lat, p.lng], 16.5, { duration: 1.2, easeLinearity: 0.25 });
                        });
                    });

                    if (userLoc) {
                        setTimeout(function() {
                            map.flyTo([userLoc.lat, userLoc.lng], 16, { animate: true, duration: 1.8 });
                        }, 500);
                    } else if (bounds.length === 1) {
                        map.setView(bounds[0], 15);
                    } else if (bounds.length > 1) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                    }
                </script>
            </body>
        </html>
    `;
};
