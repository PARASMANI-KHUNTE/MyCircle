export type AlertButton = {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
    cancelable?: boolean;
    onDismiss?: () => void;
};

export type AlertRequest = {
    title: string;
    message?: string;
    buttons?: AlertButton[];
    options?: AlertOptions;
};

type AlertHandler = (request: AlertRequest) => void;

let alertHandler: AlertHandler | null = null;

export const setAlertHandler = (handler: AlertHandler | null) => {
    alertHandler = handler;
};

export const Alert = {
    alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
        const request: AlertRequest = {
            title,
            message,
            buttons,
            options,
        };

        if (alertHandler) {
            alertHandler(request);
            return;
        }

        const fallbackMessage = message ? ` ${message}` : '';
        console.warn(`[CustomAlert missing provider] ${title}.${fallbackMessage}`);
        buttons?.[0]?.onPress?.();
    },
};

