/**
 * Trie (Prefix Tree) + Aho-Corasick inspired multi-pattern matcher for high-throughput
 * O(N) profanity and keyword moderation without running M repetitive RegEx scans.
 */
class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.word = null;
    }
}

class FastKeywordTrie {
    constructor(words = []) {
        this.root = new TrieNode();
        words.forEach((word) => this.insert(word));
    }

    insert(word) {
        if (!word) return;
        let current = this.root;
        const normalized = word.trim().toLowerCase();

        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char);
        }
        current.isEndOfWord = true;
        current.word = normalized;
    }

    /**
     * Scans arbitrary text in linear O(N) time where N is the character length of the text.
     */
    containsMatch(text) {
        if (!text) return false;
        const normalized = text.toLowerCase();
        const n = normalized.length;

        for (let i = 0; i < n; i++) {
            let current = this.root;
            for (let j = i; j < n; j++) {
                const char = normalized[j];
                if (!current.children.has(char)) {
                    break;
                }
                current = current.children.get(char);
                if (current.isEndOfWord) {
                    // Check word boundary for latin characters to avoid false positives (e.g. "ass" in "pass")
                    const isStartBoundary = i === 0 || !/[a-z0-9]/.test(normalized[i - 1]);
                    const isEndBoundary = j === n - 1 || !/[a-z0-9]/.test(normalized[j + 1]);

                    // For non-latin (like Devanagari), boundaries don't use latin regex
                    const isDevanagari = /[\u0900-\u097F]/.test(current.word);
                    if (isDevanagari || (isStartBoundary && isEndBoundary)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

module.exports = {
    FastKeywordTrie,
};
