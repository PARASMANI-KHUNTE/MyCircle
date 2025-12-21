
export const getSmartSuggestions = (lastMessageText) => {
    if (!lastMessageText) return ["Hi there!", "Hello!", "Is this available?"];

    const lower = lastMessageText.toLowerCase();

    // Greetings
    if (lower.match(/\b(hi|hello|hey|greetings)\b/)) {
        return ["Hi!", "Hello there!", "How can I help?", "Hey!"];
    }
    if (lower.match(/\b(how are you|how is it going|how's it going|what's up)\b/)) {
        return ["I'm good, thanks!", "Doing great!", "All good, you?", "I'm fine."];
    }

    // Availability / Interest (Marketplace context)
    if (lower.match(/\b(available|still have|selling)\b/)) {
        return ["Yes, it is!", "Still available.", "Sold, sorry.", "Pending pickup."];
    }
    if (lower.match(/\b(price|cost|how much)\b/)) {
        return ["It's negotiable.", "Price is fixed.", "Make me an offer.", "Check the description."];
    }
    if (lower.match(/\b(where|location|located)\b/)) {
        return ["I'm in Downtown.", "Near the station.", "Can meet publicly.", "Check my profile."];
    }

    // Logistics
    if (lower.match(/\b(meet|time|when)\b/)) {
        return ["Tonight works?", "Tomorrow morning?", "Weekend is best.", "Let me check."];
    }
    if (lower.match(/\b(thanks|thank you)\b/)) {
        return ["You're welcome!", "No problem.", "Anytime!", "Glad to help."];
    }
    if (lower.match(/\b(bye|see you|later)\b/)) {
        return ["Bye!", "See ya!", "Take care.", "Have a good one."];
    }

    // Default / Generic
    if (lower.endsWith('?')) {
        return ["Yes.", "No.", "Not sure.", "Maybe."];
    }

    // Conversation starters if unclear
    return ["Tell me more.", "Sounds good.", "Okay.", "Interesting."];
};
