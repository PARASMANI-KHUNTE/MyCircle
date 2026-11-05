const { getServiceContract } = require('../../config/serviceContracts');
const {
    SERVICE_NAMES,
    getServiceTimeoutMs,
    getServiceUrl,
} = require('./serviceRegistry');

const checkService = async (serviceName, fetchImpl = global.fetch) => {
    const baseUrl = getServiceUrl(serviceName);
    if (!baseUrl) {
        return { status: 'not_configured' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getServiceTimeoutMs());

    try {
        const contract = getServiceContract(serviceName);
        const response = await fetchImpl(new URL(contract.healthPath, baseUrl), {
            method: 'GET',
            headers: { accept: 'application/json' },
            signal: controller.signal,
        });

        return {
            status: response.ok ? 'ok' : 'error',
            httpStatus: response.status,
        };
    } catch (error) {
        return {
            status: error.name === 'AbortError' ? 'timeout' : 'error',
            message: error.message,
        };
    } finally {
        clearTimeout(timeout);
    }
};

const checkConfiguredServices = async (fetchImpl = global.fetch) => {
    const entries = await Promise.all(
        SERVICE_NAMES.map(async (serviceName) => [
            serviceName,
            await checkService(serviceName, fetchImpl),
        ]),
    );
    const services = Object.fromEntries(entries);
    const configuredStatuses = Object.values(services)
        .filter(({ status }) => status !== 'not_configured')
        .map(({ status }) => status);

    return {
        services,
        allHealthy: configuredStatuses.every((status) => status === 'ok'),
    };
};

module.exports = {
    checkConfiguredServices,
    checkService,
};
