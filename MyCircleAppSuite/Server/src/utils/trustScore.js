const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateTrustScore = (user) => {
    const averageRating = Number(user.rating || 0);
    const reviewsCount = Number(user.reviews || 0);
    const tasksCompleted = Number(user.stats?.tasksCompleted || 0);
    const profileCompleteness = [
        user.avatar,
        user.bio,
        user.location,
        Array.isArray(user.skills) && user.skills.length > 0,
        user.contactPhone || user.contactWhatsapp,
    ].filter(Boolean).length;

    let score = 45;
    score += averageRating * 7;
    score += Math.min(reviewsCount, 20);
    score += Math.min(tasksCompleted * 2, 20);
    score += profileCompleteness * 2;
    if (user.reputation?.isVerified) {
        score += 8;
    }

    return clamp(Math.round(score), 0, 100);
};

const applyNewRating = async (user, score) => {
    const previousReviews = Number(user.reviews || 0);
    const previousAverage = Number(user.rating || 0);
    const totalScore = previousAverage * previousReviews + score;

    user.reviews = previousReviews + 1;
    user.rating = Number((totalScore / user.reviews).toFixed(2));
    user.reputation.reviewsCount = user.reviews;
    user.reputation.trustScore = calculateTrustScore(user);

    await user.save();
};

const refreshTrustScore = async (user) => {
    user.reputation.trustScore = calculateTrustScore(user);
    await user.save();
};

module.exports = {
    calculateTrustScore,
    applyNewRating,
    refreshTrustScore,
};
