import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { AlertButton, AlertRequest, setAlertHandler } from '../../utils/alert';

const normalizeButtons = (buttons?: AlertButton[]) => {
    if (!buttons || buttons.length === 0) {
        return [{ text: 'OK', style: 'default' as const }];
    }

    return buttons.map((button) => ({
        text: button.text || 'OK',
        style: button.style || 'default',
        onPress: button.onPress,
    }));
};

const AlertHost = () => {
    const { colors, shadow } = useTheme();
    const queueRef = useRef<AlertRequest[]>([]);
    const currentRef = useRef<AlertRequest | null>(null);
    const [currentAlert, setCurrentAlert] = useState<AlertRequest | null>(null);

    const showNext = useCallback(() => {
        const nextAlert = queueRef.current.shift() || null;
        currentRef.current = nextAlert;
        setCurrentAlert(nextAlert);
    }, []);

    const enqueueAlert = useCallback((request: AlertRequest) => {
        if (currentRef.current) {
            queueRef.current.push(request);
            return;
        }

        currentRef.current = request;
        setCurrentAlert(request);
    }, []);

    useEffect(() => {
        setAlertHandler(enqueueAlert);
        return () => setAlertHandler(null);
    }, [enqueueAlert]);

    const closeAlert = useCallback((button?: AlertButton) => {
        const activeAlert = currentRef.current;
        currentRef.current = null;
        setCurrentAlert(null);

        setTimeout(() => {
            if (button?.onPress) {
                button.onPress();
            } else {
                activeAlert?.options?.onDismiss?.();
            }
            showNext();
        }, 0);
    }, [showNext]);

    const handleBackdropPress = useCallback(() => {
        if (!currentAlert?.options?.cancelable) return;

        const buttons = normalizeButtons(currentAlert.buttons);
        const cancelButton = buttons.find((button) => button.style === 'cancel');
        closeAlert(cancelButton);
    }, [closeAlert, currentAlert]);

    const buttons = currentAlert ? normalizeButtons(currentAlert.buttons) : [];
    const isStacked = buttons.length > 2;

    return (
        <Modal
            transparent
            visible={!!currentAlert}
            animationType="fade"
            onRequestClose={handleBackdropPress}
        >
            <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleBackdropPress}>
                <Pressable
                    style={[styles.container, shadow.md, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}
                    onPress={(event) => event.stopPropagation()}
                >
                    <Text style={[styles.title, { color: colors.text }]}>{currentAlert?.title}</Text>
                    {!!currentAlert?.message && (
                        <Text style={[styles.message, { color: colors.textSecondary }]}>{currentAlert.message}</Text>
                    )}

                    <View style={[styles.actions, isStacked && styles.actionsStacked]}>
                        {buttons.map((button, index) => {
                            const isDestructive = button.style === 'destructive';
                            const isCancel = button.style === 'cancel';
                            const isSolo = buttons.length === 1;

                            return (
                                <TouchableOpacity
                                    key={`${button.text}-${index}`}
                                    onPress={() => closeAlert(button)}
                                    style={[
                                        styles.button,
                                        isStacked ? styles.buttonStacked : styles.buttonInline,
                                        isSolo && styles.buttonSolo,
                                        {
                                            backgroundColor: isCancel
                                                ? 'transparent'
                                                : isDestructive
                                                    ? colors.danger
                                                    : colors.primary,
                                            borderColor: isCancel ? colors.borderSoft : 'transparent',
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            {
                                                color: isCancel ? colors.text : colors.white,
                                            }
                                        ]}
                                    >
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const AlertProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {children}
            <AlertHost />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionsStacked: {
        flexDirection: 'column',
    },
    button: {
        minHeight: 48,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    buttonInline: {
        flex: 1,
    },
    buttonStacked: {
        width: '100%',
    },
    buttonSolo: {
        minWidth: 120,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default AlertProvider;
