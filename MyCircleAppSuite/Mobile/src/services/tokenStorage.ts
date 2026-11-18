import * as Keychain from 'react-native-keychain';

/**
 * Single source of truth for auth token storage.
 *
 * The API client and AuthContext used to read/write the Keychain with
 * different `service` values. Writes went to the default service while reads
 * looked for dedicated `access_token` / `refresh_token` services, so every
 * authenticated request was sent without the `x-auth-token` header.
 */
export const ACCESS_TOKEN_SERVICE = 'access_token';
export const REFRESH_TOKEN_SERVICE = 'refresh_token';

const TOKEN_USERNAME = 'token';

type TokenKind = 'access' | 'refresh';

let cachedAccessToken: string | null | undefined;
let cachedRefreshToken: string | null | undefined;

const serviceFor = (kind: TokenKind) =>
    kind === 'access' ? ACCESS_TOKEN_SERVICE : REFRESH_TOKEN_SERVICE;

const readFromService = async (service: string): Promise<string | null> => {
    try {
        const credentials = await Keychain.getGenericPassword({ service });
        if (credentials && typeof credentials === 'object' && credentials.password) {
            return credentials.password;
        }
    } catch (error) {
        console.warn(`Failed to read credentials for service "${service}"`, error);
    }
    return null;
};

/**
 * Older builds wrote both tokens without a `service` option, which meant they
 * shared the default Keychain entry (and overwrote each other). Recover
 * whichever token survived and move it to its dedicated service.
 */
const migrateLegacyToken = async (): Promise<void> => {
    try {
        const legacy = await Keychain.getGenericPassword();
        if (!legacy || typeof legacy !== 'object' || !legacy.password) {
            return;
        }

        let service: string | null = null;
        if (legacy.username === ACCESS_TOKEN_SERVICE) {
            service = ACCESS_TOKEN_SERVICE;
        } else if (legacy.username === REFRESH_TOKEN_SERVICE) {
            service = REFRESH_TOKEN_SERVICE;
        }

        if (!service) {
            return;
        }

        await Keychain.setGenericPassword(TOKEN_USERNAME, legacy.password, { service });
        await Keychain.resetGenericPassword().catch(() => undefined);
    } catch (error) {
        console.warn('Failed to migrate legacy credentials', error);
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    if (cachedAccessToken !== undefined) {
        return cachedAccessToken;
    }

    cachedAccessToken = await readFromService(ACCESS_TOKEN_SERVICE);
    if (!cachedAccessToken) {
        await migrateLegacyToken();
        cachedAccessToken = await readFromService(ACCESS_TOKEN_SERVICE);
    }
    return cachedAccessToken;
};

export const getRefreshToken = async (): Promise<string | null> => {
    if (cachedRefreshToken !== undefined) {
        return cachedRefreshToken;
    }

    cachedRefreshToken = await readFromService(REFRESH_TOKEN_SERVICE);
    if (!cachedRefreshToken) {
        await migrateLegacyToken();
        cachedRefreshToken = await readFromService(REFRESH_TOKEN_SERVICE);
    }
    return cachedRefreshToken;
};

export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
        Keychain.setGenericPassword(TOKEN_USERNAME, accessToken, { service: ACCESS_TOKEN_SERVICE }),
        Keychain.setGenericPassword(TOKEN_USERNAME, refreshToken, { service: REFRESH_TOKEN_SERVICE }),
    ]);
    cachedAccessToken = accessToken;
    cachedRefreshToken = refreshToken;
};

export const clearTokens = async (): Promise<void> => {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    await Promise.all([
        Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE }).catch(() => undefined),
        Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE }).catch(() => undefined),
        Keychain.resetGenericPassword().catch(() => undefined),
    ]);
};
