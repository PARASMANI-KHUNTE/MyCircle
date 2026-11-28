import {
    getAiListItems,
    getLocalPlaceholderSuggestion,
} from '../src/utils/aiPlaceholders';

describe('ai placeholders', () => {
    it('uses stable keyword matches without any network request', () => {
        const first = getLocalPlaceholderSuggestion('Leaking sink', 'Need a plumber today', 'service');
        const second = getLocalPlaceholderSuggestion('Leaking sink', 'Need a plumber today', 'service');

        expect(first).toEqual({ icon: 'Wrench', gifKeywords: ['repair', 'tools'] });
        expect(second).toEqual(first);
    });

    it('falls back to the post type', () => {
        expect(getLocalPlaceholderSuggestion('Old sofa', '', 'sell')).toEqual({
            icon: 'ShoppingBag',
            gifKeywords: ['shopping', 'market'],
        });
        expect(getLocalPlaceholderSuggestion('Mystery item', '', '')).toEqual({
            icon: 'Zap',
            gifKeywords: ['abstract'],
        });
    });

    it('extracts renderable AI tips and facts', () => {
        expect(getAiListItems({ listItems: ['Check nearby rates', '', null, 'Meet in public'] }))
            .toEqual(['Check nearby rates', 'Meet in public']);
        expect(getAiListItems(null)).toEqual([]);
    });
});
