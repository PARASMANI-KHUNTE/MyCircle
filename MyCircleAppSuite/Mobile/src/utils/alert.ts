import { formatErrorMessage } from './errorMessage';

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
    alert(title: string, message?: any, buttons?: AlertButton[], options?: AlertOptions) {
        const sanitizedMessage = message ? formatErrorMessage(message, typeof message === 'string' ? message : undefined) : undefined;
        const request: AlertRequest = {
            title,
            message: sanitizedMessage,
            buttons,
            options,
        };

        if (alertHandler) {
            alertHandler(request);
            return;
        }

        const fallbackMessage = sanitizedMessage ? ` ${sanitizedMessage}` : '';
        console.warn(`[CustomAlert missing provider] ${title}.${fallbackMessage}`);
        buttons?.[0]?.onPress?.();
    },
};

