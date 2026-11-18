/**
 * Keyless map tile sources.
 *
 * The app used to render CARTO basemaps (basemaps.cartocdn.com). CARTO now
 * requires an API key and, without one, serves "API key required" watermark
 * tiles instead of map data — which left every map blank. These Esri ArcGIS
 * Online "canvas" tiles are keyless and are the closest match to CARTO's
 * minimal light/dark styles.
 *
 * NOTE: Esri's URL scheme is {z}/{y}/{x} (row before column), unlike the
 * {z}/{x}/{y} used by CARTO/OSM.
 */

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/** Esri canvas basemaps only serve tiles up to zoom 16; Leaflet upscales beyond. */
export const MAP_MAX_NATIVE_ZOOM = 16;

export const MAP_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.esri.com/">Esri</a>';

/** Light canvas basemap (roads, water, land). */
export const LIGHT_TILE_URL = `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`;

/** Dark canvas basemap (roads, water, land). */
export const DARK_TILE_URL = `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`;

/** Place-name / boundary labels, drawn on top of either basemap. */
export const LABELS_TILE_URL = `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`;

/** Pick the basemap for the current theme. */
export const tileUrlFor = (isDark) => (isDark ? DARK_TILE_URL : LIGHT_TILE_URL);
