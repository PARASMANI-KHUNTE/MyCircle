import CodePush, {
    SyncStatus,
    InstallMode,
    DownloadProgress,
    LocalPackage,
} from 'react-native-code-push';

export interface UpdateStatusState {
    status: SyncStatus | null;
    statusText: string;
    isUpdating: boolean;
    progress: number;
}

const getStatusMessage = (status: SyncStatus): string => {
    switch (status) {
        case SyncStatus.CHECKING_FOR_UPDATE:
            return 'Checking for updates...';
        case SyncStatus.DOWNLOADING_PACKAGE:
            return 'Downloading update...';
        case SyncStatus.INSTALLING_UPDATE:
            return 'Installing update...';
        case SyncStatus.UP_TO_DATE:
            return 'App is up to date';
        case SyncStatus.UPDATE_INSTALLED:
            return 'Update installed. Restart to apply.';
        case SyncStatus.UPDATE_IGNORED:
            return 'Update postponed';
        case SyncStatus.UNKNOWN_ERROR:
            return 'Unable to check for updates';
        default:
            return '';
    }
};

export const checkForAppUpdate = async (
    options?: {
        isManual?: boolean;
        onStatusChange?: (state: UpdateStatusState) => void;
    }
): Promise<{ success: boolean; message: string }> => {
    if (__DEV__) {
        const msg = 'OTA updates are disabled in development mode.';
        options?.onStatusChange?.({
            status: SyncStatus.UP_TO_DATE,
            statusText: msg,
            isUpdating: false,
            progress: 100,
        });
        return { success: true, message: msg };
    }

    try {
        let lastStatus: SyncStatus = SyncStatus.CHECKING_FOR_UPDATE;
        const syncStatus = await CodePush.sync(
            {
                installMode: options?.isManual
                    ? InstallMode.IMMEDIATE
                    : InstallMode.ON_NEXT_RESUME,
                minimumBackgroundDuration: 120,
            },
            (status: SyncStatus) => {
                lastStatus = status;
                const statusText = getStatusMessage(status);
                const isUpdating =
                    status === SyncStatus.DOWNLOADING_PACKAGE ||
                    status === SyncStatus.INSTALLING_UPDATE;
                options?.onStatusChange?.({
                    status,
                    statusText,
                    isUpdating,
                    progress: status === SyncStatus.UPDATE_INSTALLED ? 100 : 0,
                });
            },
            (progress: DownloadProgress) => {
                const percent = progress.totalBytes
                    ? Math.round((progress.receivedBytes / progress.totalBytes) * 100)
                    : 0;
                options?.onStatusChange?.({
                    status: SyncStatus.DOWNLOADING_PACKAGE,
                    statusText: `Downloading: ${percent}%`,
                    isUpdating: true,
                    progress: percent,
                });
            }
        );

        return {
            success: syncStatus !== SyncStatus.UNKNOWN_ERROR,
            message: getStatusMessage(syncStatus) || getStatusMessage(lastStatus),
        };
    } catch (error: any) {
        const errorMessage = error?.message || 'Error checking for updates';
        options?.onStatusChange?.({
            status: SyncStatus.UNKNOWN_ERROR,
            statusText: errorMessage,
            isUpdating: false,
            progress: 0,
        });
        return { success: false, message: errorMessage };
    }
};

export const getInstalledPackageMetadata = async (): Promise<LocalPackage | null> => {
    try {
        if (__DEV__) return null;
        return await CodePush.getUpdateMetadata();
    } catch {
        return null;
    }
};

export default {
    checkForAppUpdate,
    getInstalledPackageMetadata,
};
