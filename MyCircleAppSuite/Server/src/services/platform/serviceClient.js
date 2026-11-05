const { getServiceTimeoutMs, getServiceUrl } = require('./serviceRegistry');

const createServiceClient = ({ fetchImpl = global.fetch, serviceName }) => {
    if (typeof fetchImpl !== 'function') {
        throw new Error('A fetch implementation is required');
    }

    return async (path, options = {}, context = {}) => {
        const baseUrl = getServiceUrl(serviceName);
        if (!baseUrl) {
            throw new Error(`${serviceName} service URL is not configured`);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), getServiceTimeoutMs());

        try {
            const headers = new Headers(options.headers || {});
            headers.set('accept', 'application/json');
            if (context.requestId) headers.set('x-request-id', context.requestId);
            if (context.authorization) headers.set('authorization', context.authorization);

            return await fetchImpl(new URL(path, baseUrl), {
                ...options,
                headers,
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }
    };
};

module.exports = { createServiceClient };
