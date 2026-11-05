const SERVICE_NAMES = Object.freeze([
    'identity',
    'marketplace',
    'contact',
    'communication',
    'safety',
    'notifications',
]);

const getServiceUrl = (serviceName) => {
    if (!SERVICE_NAMES.includes(serviceName)) {
        throw new Error(`Unknown service: ${serviceName}`);
    }

    const key = `${serviceName.toUpperCase()}_SERVICE_URL`;
    return process.env[key] || null;
};

const getServiceTimeoutMs = () => {
    const value = Number.parseInt(process.env.SERVICE_TIMEOUT_MS || '3000', 10);
    return Number.isFinite(value) && value > 0 ? value : 3000;
};

module.exports = {
    SERVICE_NAMES,
    getServiceUrl,
    getServiceTimeoutMs,
};
