const ApiError = require('../utils/ApiError');
const { createServiceClient } = require('../services/platform/serviceClient');
const { getServiceUrl } = require('../services/platform/serviceRegistry');

const DEFAULT_PROXY_METHODS = Object.freeze(['GET', 'HEAD', 'OPTIONS']);

const serviceRouter = ({
    serviceName,
    fetchImpl,
    methods = DEFAULT_PROXY_METHODS,
} = {}) => {
    if (!serviceName) {
        throw new Error('A service name is required');
    }

    const allowedMethods = new Set(methods);
    const client = createServiceClient({ fetchImpl, serviceName });

    return async (req, res, next) => {
        if (!getServiceUrl(serviceName) || !allowedMethods.has(req.method)) {
            return next();
        }

        try {
            const contentType = req.get('content-type') || '';
            const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
            if (hasBody && contentType && !contentType.includes('application/json')) {
                return next();
            }

            const response = await client(req.originalUrl, {
                method: req.method,
                ...(hasBody && req.body !== undefined
                    ? {
                        body: JSON.stringify(req.body),
                        headers: { 'content-type': 'application/json' },
                    }
                    : {}),
            }, {
                requestId: req.requestId,
                authorization: req.get('authorization'),
            });

            res.status(response.status);
            response.headers?.forEach((value, key) => {
                if (key.toLowerCase() !== 'transfer-encoding') {
                    res.setHeader(key, value);
                }
            });

            if (req.method === 'HEAD' || response.status === 204) {
                return res.end();
            }

            const body = await response.arrayBuffer();
            return res.send(Buffer.from(body));
        } catch (error) {
            return next(new ApiError(
                error.name === 'AbortError' ? 504 : 503,
                `${serviceName} service is unavailable`,
                true,
                error.stack,
            ));
        }
    };
};

module.exports = {
    DEFAULT_PROXY_METHODS,
    serviceRouter,
};
