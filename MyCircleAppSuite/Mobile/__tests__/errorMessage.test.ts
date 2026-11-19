import { formatErrorMessage } from '../src/utils/errorMessage';

describe('formatErrorMessage', () => {
    it('returns default fallback when error is null or undefined', () => {
        expect(formatErrorMessage(null)).toBe('Something went wrong. Please try again.');
        expect(formatErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    });

    it('sanitizes network errors into user-friendly message', () => {
        expect(formatErrorMessage(new Error('Network Error'))).toBe(
            'Unable to connect to the server. Please check your internet connection.'
        );
        expect(formatErrorMessage('connect ECONNREFUSED 127.0.0.1:5000')).toBe(
            'Unable to connect to the server. Please check your internet connection.'
        );
    });

    it('sanitizes expired sessions and auth errors', () => {
        expect(formatErrorMessage('jwt expired')).toBe(
            'Your session has expired. Please sign in again to continue.'
        );
        expect(formatErrorMessage({ response: { status: 401, data: { msg: 'Unauthorized' } } })).toBe(
            'Your session has expired. Please sign in again to continue.'
        );
    });

    it('sanitizes 500 internal server errors', () => {
        expect(formatErrorMessage(new Error('Request failed with status code 500'))).toBe(
            'Something went wrong on our end. Please try again in a moment.'
        );
    });

    it('preserves clean user-facing validation messages', () => {
        expect(formatErrorMessage('Price must be a valid non-negative number')).toBe(
            'Price must be a valid non-negative number'
        );
        expect(formatErrorMessage({ response: { data: { msg: 'Email is required' } } })).toBe(
            'Email is required'
        );
    });

    it('handles Google Sign-In cancellation gracefully', () => {
        expect(formatErrorMessage('SIGN_IN_CANCELLED')).toBe('Google Sign-In was cancelled.');
    });
});
