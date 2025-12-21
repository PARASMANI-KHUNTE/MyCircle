/**
 * Simple profanity filter to detect inappropriate words
 * @param {string} text - The text to check
 * @returns {boolean} - True if profanity is found, false otherwise
 */
const containsProfanity = (text) => {
    if (!text) return false;

    // List of basic profanity words
    const badWords = [
        'abuse', 'harass', 'hate', 'violence', 'stupid', 'idiot', 'damn', 'hell', 'ass', 'bitch', 'fuck', 'shit'
    ];

    const formattedText = text.toLowerCase();
    return badWords.some(word => formattedText.includes(word));
};

module.exports = {
    containsProfanity
};
