/**
 * Keyless map tile sources (see Web/src/config/mapTiles.js for the rationale).
 *
 * CARTO basemaps now require an API key and, without one, return watermark
 * tiles, so maps rendered blank. These Esri ArcGIS Online canvas tiles are
 * keyless. Note Esri's URL scheme is {z}/{y}/{x} (row before column).
 */

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/** Esri canvas basemaps only serve tiles up to zoom 16; Leaflet upscales beyond. */
export const MAP_MAX_NATIVE_ZOOM = 16;

export const MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; Esri';

export const LIGHT_TILE_URL = `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
export const DARK_TILE_URL = `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
export const LABELS_TILE_URL = `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`;

/** Pick the basemap for the current theme. */
export const tileUrlFor = (isDark: boolean) => (isDark ? DARK_TILE_URL : LIGHT_TILE_URL);
