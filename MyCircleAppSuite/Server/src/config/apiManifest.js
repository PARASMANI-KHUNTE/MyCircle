const apiManifest = Object.freeze([
    Object.freeze({ mount: '/auth', owner: 'identity', module: 'authRoutes' }),
    Object.freeze({ mount: '/api/user', owner: 'identity', module: 'userRoutes' }),
    Object.freeze({ mount: '/api/posts', owner: 'marketplace', module: 'postRoutes' }),
    Object.freeze({ mount: '/api/contacts', owner: 'contact', module: 'contactRoutes' }),
    Object.freeze({ mount: '/api/chat', owner: 'communication', module: 'chatRoutes' }),
    Object.freeze({ mount: '/api/notifications', owner: 'notifications', module: 'notificationRoutes' }),
    Object.freeze({ mount: '/api/ai', owner: 'safety', module: 'aiRoutes' }),
]);

const getApiManifest = () => apiManifest.map((entry) => ({ ...entry }));

module.exports = {
    apiManifest,
    getApiManifest,
};
