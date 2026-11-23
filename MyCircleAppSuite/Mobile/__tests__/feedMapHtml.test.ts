import { buildFeedMapHtml, buildLocationUpdateScript } from '../src/utils/feedMapHtml';
import { DARK_TILE_URL, LIGHT_TILE_URL } from '../src/constants/mapTiles';

const maliciousTitle = '</script><script>window.__pwned = true</script>';

const options = {
    background: '#09090b',
    isDark: true,
    userLocation: null,
    distanceRadius: 50,
    posts: [{
        _id: 'post-1',
        fuzzedLat: 28.6139,
        fuzzedLng: 77.209,
        type: 'job',
        price: '<img src=x onerror=alert(1)>',
        title: maliciousTitle,
    }],
};

describe('buildFeedMapHtml', () => {
    it('escapes serialized post data so a title cannot break out of the script', () => {
        const html = buildFeedMapHtml(options);

        expect(html).not.toContain('</script><script>');
        expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003e');
        expect(html.match(/<script/g)).toHaveLength(2);
        expect(html.match(/<\/script>/g)).toHaveLength(2);
    });

    it('uses dark tiles when the theme is dark', () => {
        const darkHtml = buildFeedMapHtml(options);
        const lightHtml = buildFeedMapHtml({ ...options, isDark: false });

        expect(darkHtml).toContain(DARK_TILE_URL);
        expect(darkHtml).not.toContain(LIGHT_TILE_URL);
        expect(lightHtml).toContain(LIGHT_TILE_URL);
        expect(lightHtml).not.toContain(DARK_TILE_URL);
    });

    it('exposes an in-place location updater so GPS fixes do not reload the map', () => {
        const html = buildFeedMapHtml(options);

        expect(html).toContain('window.updateUserLocation = function(location)');
        expect(html).toContain('map.removeLayer(userMarker)');
        expect(html).toContain('replaceUserLayers(userLoc)');
        expect(html).not.toContain('location.reload');
    });

    it('builds an escaped injection script for routine location updates', () => {
        const script = buildLocationUpdateScript({ lat: 0, lng: 0 });

        expect(script).toContain('window.updateUserLocation({"lat":0,"lng":0})');
        expect(buildLocationUpdateScript(null)).toContain('window.updateUserLocation(null)');

        const unsafe = buildLocationUpdateScript({
            lat: '</script><script>alert(1)</script>',
            lng: 0,
        } as any);
        expect(unsafe).not.toContain('</script><script>');
        expect(unsafe).toContain('\\u003c/script\\u003e');
    });

    it('collects marker bounds before fitting them and caps animation delays', () => {
        const html = buildFeedMapHtml({
            ...options,
            posts: Array.from({ length: 60 }, (_, index) => ({
                ...options.posts[0],
                _id: `post-${index}`,
            })),
        });

        expect(html.indexOf('bounds.push([p.lat, p.lng])')).toBeLessThan(html.indexOf('map.fitBounds('));
        expect(html).not.toContain('setTimeout(function() {\\n                            // Custom Premium Marker');
        expect(html).toContain("Math.min(index * 100, 600) + 'ms'");
        expect(html).not.toContain('p.title +');
        expect(html).toContain('price.textContent');
    });
});
