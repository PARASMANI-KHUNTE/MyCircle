import React, { useState } from 'react';

import ThemedAlert from '../components/ui/ThemedAlert';

type ConfirmRequest = {
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
};

export const useConfirmDialog = () => {
    const [request, setRequest] = useState<ConfirmRequest | null>(null);

    const confirm = (next: ConfirmRequest) => setRequest(next);

    const dialog = (
        <ThemedAlert
            visible={!!request}
            title={request?.title || ''}
            message={request?.message || ''}
            confirmText={request?.confirmText || 'Confirm'}
            isDestructive={request?.isDestructive}
            onCancel={() => setRequest(null)}
            onConfirm={() => {
                request?.onConfirm();
                setRequest(null);
            }}
        />
    );

    return { confirm, dialog };
};
