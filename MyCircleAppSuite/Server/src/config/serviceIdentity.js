const VALID_SERVICE_NAMES = new Set([
    'api',
    'identity',
    'marketplace',
    'contact',
    'communication',
    'safety',
    'notifications',
    'payment',
]);

const getServiceName = () => {
    const serviceName = process.env.SERVICE_NAME || 'api';
    return VALID_SERVICE_NAMES.has(serviceName) ? serviceName : 'api';
};

module.exports = {
    VALID_SERVICE_NAMES,
    getServiceName,
};
