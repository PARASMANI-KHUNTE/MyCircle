const serviceContracts = Object.freeze({
    identity: Object.freeze({
        owner: 'identity',
        healthPath: '/health/live',
        persistence: 'users and authentication state',
        events: Object.freeze(['user.created', 'user.updated']),
    }),
    marketplace: Object.freeze({
        owner: 'marketplace',
        healthPath: '/health/live',
        persistence: 'posts and marketplace projections',
        events: Object.freeze(['post.created', 'post.updated', 'post.closed', 'post.expired']),
    }),
    contact: Object.freeze({
        owner: 'contact',
        healthPath: '/health/live',
        persistence: 'contact requests and approval state',
        events: Object.freeze(['contact.requested', 'contact.approved', 'contact.rejected']),
    }),
    communication: Object.freeze({
        owner: 'communication',
        healthPath: '/health/live',
        persistence: 'conversations and messages',
        events: Object.freeze(['conversation.created', 'message.created', 'message.read']),
    }),
    safety: Object.freeze({
        owner: 'safety',
        healthPath: '/health/live',
        persistence: 'reports, moderation decisions, and violations',
        events: Object.freeze(['content.flagged', 'moderation.completed', 'user.restricted']),
    }),
    notifications: Object.freeze({
        owner: 'notifications',
        healthPath: '/health/live',
        persistence: 'notifications and delivery state',
        events: Object.freeze(['notification.created', 'notification.delivered']),
    }),
});

const getServiceContract = (serviceName) => {
    const contract = serviceContracts[serviceName];
    if (!contract) {
        throw new Error(`Unknown service: ${serviceName}`);
    }

    return {
        ...contract,
        events: [...contract.events],
    };
};

module.exports = {
    serviceContracts,
    getServiceContract,
};
