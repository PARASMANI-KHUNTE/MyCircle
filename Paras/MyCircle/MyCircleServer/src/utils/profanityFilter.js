/**
 * Enhanced profanity filter with word boundary matching and Hindi support
 * @param {string} text - The text to check
 * @returns {boolean} - True if profanity is found, false otherwise
 */
const containsProfanity = (text) => {
    if (!text) return false;

    const formattedText = text.toLowerCase();

    // English profanity words (using word boundaries to avoid false positives)
    const englishBadWords = [
        'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'cock', 'pussy',
        'cunt', 'whore', 'slut', 'fag', 'nigger', 'retard', 'rape', 'kill yourself',
        'kys', 'die', 'murder', 'terrorist', 'bomb', 'weapon', 'drugs', 'cocaine',
        'heroin', 'meth', 'weed sale', 'porn', 'sex for money', 'prostitute'
    ];

    // Hindi profanity words (Devanagari and transliterated)
    const hindiBadWords = [
        // Devanagari script
        'चूतिया', 'भोसडीके', 'मादरचोद', 'बहनचोद', 'गांडू', 'रंडी', 'हरामी',
        'कुत्ता', 'साला', 'कमीना', 'बेवकूफ', 'गधा', 'उल्लू',
        // Transliterated (Roman script)
        'chutiya', 'bhosadike', 'madarchod', 'behenchod', 'gandu', 'randi',
        'harami', 'kutta', 'sala', 'kamina', 'bewakoof', 'gadha', 'ullu',
        'mc', 'bc', 'mkc', 'bkl'
    ];

    const allBadWords = [...englishBadWords, ...hindiBadWords];

    // Check for exact word matches using word boundaries
    for (const word of allBadWords) {
        // Create regex with word boundaries for English words
        // For Hindi/Devanagari, use simple includes since word boundaries don't work well
        if (/^[a-zA-Z\s]+$/.test(word)) {
            // English word - use word boundary
            const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
            if (regex.test(formattedText)) {
                return true;
            }
        } else {
            // Hindi/Devanagari word - use includes
            if (formattedText.includes(word)) {
                return true;
            }
        }
    }

    // Check for common obfuscation patterns (e.g., f*ck, sh!t)
    const obfuscationPatterns = [
        /f[\*u@]c?k/i,
        /sh[\*i!1]t/i,
        /b[\*i!1]tch/i,
        /a[\*s$][\*s$]hole/i
    ];

    for (const pattern of obfuscationPatterns) {
        if (pattern.test(formattedText)) {
            return true;
        }
    }

    return false;
};

// Helper function to escape special regex characters
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
    containsProfanity
};
