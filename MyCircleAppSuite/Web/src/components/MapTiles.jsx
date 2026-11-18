import { TileLayer } from 'react-leaflet';
import {
    LIGHT_TILE_URL,
    DARK_TILE_URL,
    LABELS_TILE_URL,
    MAP_ATTRIBUTION,
    MAP_MAX_NATIVE_ZOOM,
} from '../config/mapTiles';

/**
 * Keyless basemap + place-label layers for react-leaflet maps.
 * Pass `dark` to use the dark basemap.
 */
export default function MapTiles({ dark = false }) {
    return (
        <>
            <TileLayer
                attribution={MAP_ATTRIBUTION}
                url={dark ? DARK_TILE_URL : LIGHT_TILE_URL}
                maxNativeZoom={MAP_MAX_NATIVE_ZOOM}
                maxZoom={19}
            />
            <TileLayer
                url={LABELS_TILE_URL}
                maxNativeZoom={MAP_MAX_NATIVE_ZOOM}
                maxZoom={19}
            />
        </>
    );
}
