declare module 'react-native-code-push' {
    import * as React from 'react';

    export interface DownloadProgress {
        totalBytes: number;
        receivedBytes: number;
    }

    export interface LocalPackage {
        appVersion: string;
        deploymentKey: string;
        description: string;
        failedInstall: boolean;
        isFirstRun: boolean;
        isMandatory: boolean;
        isPending: boolean;
        label: string;
        packageHash: string;
        packageSize: number;
    }

    export interface RemotePackage extends LocalPackage {
        downloadUrl: string;
        download(downloadProgressCallback?: (progress: DownloadProgress) => void): Promise<LocalPackage>;
        install(installMode?: InstallMode, minimumBackgroundDuration?: number): Promise<void>;
    }

    export enum CheckFrequency {
        ON_APP_START = 0,
        ON_APP_RESUME = 1,
        MANUAL = 2,
    }

    export enum InstallMode {
        IMMEDIATE = 0,
        ON_NEXT_RESTART = 1,
        ON_NEXT_RESUME = 2,
        ON_NEXT_SUSPEND = 3,
    }

    export enum SyncStatus {
        UP_TO_DATE = 0,
        UPDATE_INSTALLED = 1,
        UPDATE_IGNORED = 2,
        UNKNOWN_ERROR = 3,
        SYNC_IN_PROGRESS = 4,
        CHECKING_FOR_UPDATE = 5,
        AWAITING_USER_ACTION = 6,
        DOWNLOADING_PACKAGE = 7,
        INSTALLING_UPDATE = 8,
    }

    export interface SyncOptions {
        deploymentKey?: string;
        installMode?: InstallMode;
        mandatoryInstallMode?: InstallMode;
        minimumBackgroundDuration?: number;
        updateDialog?: boolean | {
            title?: string;
            optionalUpdateMessage?: string;
            optionalIgnoreButtonLabel?: string;
            optionalInstallButtonLabel?: string;
            mandatoryUpdateMessage?: string;
            mandatoryContinueButtonLabel?: string;
            appendReleaseDescription?: boolean;
            descriptionPrefix?: string;
        };
    }

    export interface CodePushOptions {
        checkFrequency?: CheckFrequency;
        deploymentKey?: string;
        installMode?: InstallMode;
        mandatoryInstallMode?: InstallMode;
        minimumBackgroundDuration?: number;
        updateDialog?: any;
    }

    const CodePush: {
        (options?: CodePushOptions): <T extends React.ComponentType<any>>(component: T) => T;
        checkForUpdate(deploymentKey?: string): Promise<RemotePackage | null>;
        getUpdateMetadata(updateState?: number): Promise<LocalPackage | null>;
        notifyAppReady(): Promise<void>;
        sync(
            options?: SyncOptions,
            syncStatusChangeCallback?: (status: SyncStatus) => void,
            downloadProgressCallback?: (progress: DownloadProgress) => void
        ): Promise<SyncStatus>;
        allowRestart(): void;
        disallowRestart(): void;
        restartApp(onlyIfUpdateIsPending?: boolean): void;
        CheckFrequency: typeof CheckFrequency;
        InstallMode: typeof InstallMode;
        SyncStatus: typeof SyncStatus;
    };

    export default CodePush;
}
