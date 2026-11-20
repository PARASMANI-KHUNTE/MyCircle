import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { navigationRef } from '../../services/navigationService';

interface Props {
    children: ReactNode;
    fallback?: ((error: Error, resetError: () => void) => ReactNode) | ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled React component error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        this.resetError();
        try {
            if (navigationRef.isReady()) {
                navigationRef.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' as any }],
                });
            }
        } catch (e) {
            console.warn('ErrorBoundary navigation reset failed:', e);
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback(this.state.error || new Error('Unknown error'), this.resetError);
                }
                return this.props.fallback;
            }

            return (
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="light-content" />
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <AlertTriangle size={42} color="#f87171" />
                        </View>

                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            We encountered an unexpected issue while displaying this page. Don't worry, your data is safe.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <View style={styles.devErrorBox}>
                                <Text style={styles.devErrorTitle}>Debug Info: {this.state.error.name}</Text>
                                <ScrollView style={styles.devScrollView} nestedScrollEnabled>
                                    <Text style={styles.devErrorText}>
                                        {this.state.error.message}
                                    </Text>
                                    {this.state.errorInfo?.componentStack && (
                                        <Text style={styles.devStackText}>
                                            {this.state.errorInfo.componentStack.trim()}
                                        </Text>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={this.handleGoHome}
                                activeOpacity={0.8}
                            >
                                <Home size={18} color="#94a3b8" style={styles.buttonIcon} />
                                <Text style={styles.secondaryButtonText}>Return Home</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={this.resetError}
                                activeOpacity={0.8}
                            >
                                <RefreshCw size={18} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.primaryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1120',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 320,
        marginBottom: 24,
    },
    devErrorBox: {
        width: '100%',
        maxHeight: 180,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
    },
    devErrorTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f87171',
        marginBottom: 6,
    },
    devScrollView: {
        maxHeight: 130,
    },
    devErrorText: {
        fontSize: 11,
        color: '#cbd5e1',
        fontFamily: 'monospace',
        marginBottom: 6,
    },
    devStackText: {
        fontSize: 10,
        color: '#64748b',
        fontFamily: 'monospace',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        justifyContent: 'center',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#cbd5e1',
        fontSize: 15,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 8,
    },
});

export default ErrorBoundary;
