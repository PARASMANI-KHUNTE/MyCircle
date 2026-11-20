import { validatePostDraft } from '../src/utils/postValidation';

const completeDraft = {
    type: 'job',
    subType: 'hiring',
    title: 'Need a plumber',
    description: 'Kitchen sink is leaking.',
    location: 'Connaught Place, New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    price: '500',
    duration: 10080,
    exchangePreference: 'money',
};

describe('post draft validation', () => {
    it('accepts a complete draft', () => {
        expect(validatePostDraft('all', completeDraft)).toBeNull();
    });

    it('rejects whitespace-only title and description', () => {
        expect(validatePostDraft('details', { ...completeDraft, title: '   ' })?.field).toBe('title');
        expect(validatePostDraft('details', { ...completeDraft, description: '   ' })?.field).toBe('description');
    });

    it('requires a subtype for mobile job posts', () => {
        expect(validatePostDraft('category', { ...completeDraft, subType: '' })?.field).toBe('subType');
    });

    it('requires job type for web job posts', () => {
        expect(validatePostDraft('category', { ...completeDraft, subType: '', jobType: 'plumbing' })).toBeNull();
    });

    it('requires an item category for sell/rent posts', () => {
        expect(validatePostDraft('category', { ...completeDraft, type: 'sell', subType: '', itemCategory: '' })?.field).toBe('itemCategory');
        expect(validatePostDraft('category', { ...completeDraft, type: 'sell', subType: '', itemCategory: 'electronics' })).toBeNull();
    });

    it('requires coordinates, not just a location name', () => {
        const result = validatePostDraft('location', { ...completeDraft, latitude: null, longitude: null });
        expect(result?.field).toBe('location');
    });

    it('treats zero coordinates as valid', () => {
        expect(validatePostDraft('location', { ...completeDraft, latitude: 0, longitude: 0 })).toBeNull();
    });

    it('rejects negative or non-numeric prices', () => {
        expect(validatePostDraft('exchange', { ...completeDraft, price: '-10' })?.field).toBe('price');
        expect(validatePostDraft('exchange', { ...completeDraft, price: 'abc' })?.field).toBe('price');
        expect(validatePostDraft('exchange', { ...completeDraft, price: '' })).toBeNull();
    });

    it('enforces server content limits', () => {
        expect(validatePostDraft('details', { ...completeDraft, title: 'a'.repeat(201) })?.field).toBe('title');
        expect(validatePostDraft('details', { ...completeDraft, description: 'a'.repeat(5001) })?.field).toBe('description');
    });
});
