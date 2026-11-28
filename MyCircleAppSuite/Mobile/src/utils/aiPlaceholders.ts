export interface PlaceholderSuggestion {
    icon: string;
    gifKeywords: string[];
}

const KEYWORD_RULES: Array<{ icon: string; gifKeywords: string[]; words: string[] }> = [
    {
        icon: 'Wrench',
        gifKeywords: ['repair', 'tools'],
        words: ['plumber', 'electrician', 'mechanic', 'repair', 'fix', 'service', 'cleaning'],
    },
    {
        icon: 'Briefcase',
        gifKeywords: ['office', 'work'],
        words: ['job', 'hiring', 'tutor', 'teacher', 'developer', 'designer', 'work'],
    },
    {
        icon: 'ShoppingBag',
        gifKeywords: ['shopping', 'market'],
        words: ['sell', 'sale', 'shop', 'furniture', 'bike', 'phone', 'laptop', 'dress'],
    },
    {
        icon: 'Handshake',
        gifKeywords: ['exchange', 'community'],
        words: ['barter', 'exchange', 'swap', 'trade', 'donate'],
    },
    {
        icon: 'Package',
        gifKeywords: ['delivery', 'parcel'],
        words: ['rent', 'delivery', 'pickup', 'courier', 'storage'],
    },
];

const TYPE_ICONS: Record<string, string> = {
    job: 'Briefcase',
    service: 'Wrench',
    sell: 'ShoppingBag',
    rent: 'Package',
    barter: 'Handshake',
};

const TYPE_KEYWORDS: Record<string, string[]> = {
    job: ['work'],
    service: ['tools'],
    sell: ['market'],
    rent: ['parcel'],
    barter: ['community'],
};

/**
 * Deterministic, offline placeholder suggestions. Feed cards must not hit the
 * AI endpoint just to choose an icon; 50 cards would exhaust the shared quota.
 */
export const getLocalPlaceholderSuggestion = (
    title: string = '',
    description: string = '',
    type: string = ''
): PlaceholderSuggestion => {
    const text = `${title} ${description} ${type}`.toLowerCase();
    const match = KEYWORD_RULES.find((rule) =>
        rule.words.some((word) => text.includes(word))
    );

    if (match) {
        return { icon: match.icon, gifKeywords: match.gifKeywords };
    }

    const normalizedType = type.toLowerCase();
    return {
        icon: TYPE_ICONS[normalizedType] || 'Zap',
        gifKeywords: TYPE_KEYWORDS[normalizedType] || ['abstract'],
    };
};

export const getAiListItems = (aiResult: { listItems?: unknown } | null): string[] => {
    if (!aiResult || !Array.isArray(aiResult.listItems)) return [];
    return aiResult.listItems
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
};
