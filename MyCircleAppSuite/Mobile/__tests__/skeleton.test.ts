import { getSkeletonColor } from '../src/components/ui/Skeleton';

describe('getSkeletonColor', () => {
    it('uses the dark surface in dark mode', () => {
        expect(getSkeletonColor(false, true)).toBe('#27272a');
    });

    it('uses the light surface in light mode', () => {
        expect(getSkeletonColor(false, false)).toBe('#e4e4e7');
    });

    it('honors an explicit dark override', () => {
        expect(getSkeletonColor(true, false)).toBe('#27272a');
    });
});
