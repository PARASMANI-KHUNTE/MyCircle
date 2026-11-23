const mockFocusEffects: Array<() => void> = [];

jest.mock('@react-navigation/native', () => ({
    useFocusEffect: (effect: () => void) => {
        mockFocusEffects.push(effect);
    },
}));

jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({ colors: new Proxy({}, { get: () => '#ffffff' }), isDark: false }),
}));

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
    const React = require('react');
    const { View } = require('react-native');
    const Swipeable = ({ children, renderRightActions }: any) =>
        React.createElement(
            View,
            null,
            [children, renderRightActions ? renderRightActions() : null].map((child: any, index: number) =>
                React.cloneElement(child, { key: index })
            )
        );
    return { __esModule: true, default: Swipeable };
});

jest.mock('react-native-reanimated', () => {
    const { View, Text, Image, ScrollView } = require('react-native');
    const chain: any = { delay: () => chain, springify: () => chain };
    const animation = () => chain;
    return {
        __esModule: true,
        default: {
            View,
            Text,
            Image,
            ScrollView,
            createAnimatedComponent: (Component: any) => Component,
        },
        FadeIn: animation,
        FadeInDown: chain,
        FadeInUp: chain,
        FadeInRight: animation,
        FadeOutDown: animation,
        FadeOutLeft: animation,
        SlideInRight: animation,
        useSharedValue: (value: any) => ({ value }),
        useAnimatedStyle: () => ({}),
        withDelay: (_delay: number, next: any) => next,
        withRepeat: (next: any) => next,
        withSequence: (...next: any[]) => next[next.length - 1],
        withSpring: (value: any) => value,
        withTiming: (value: any) => value,
        Easing: { ease: (value: any) => value, inOut: (easing: any) => easing },
        interpolate: () => 0,
        Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    };
});

jest.mock('../src/context/NotificationContext', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { delete: jest.fn() },
}));

jest.mock('../src/utils/alert', () => ({
    Alert: { alert: jest.fn() },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SectionList, Text, TouchableOpacity } from 'react-native';
import api from '../src/services/api';
import { Alert } from '../src/utils/alert';
import { useNotifications } from '../src/context/NotificationContext';
import NotificationsScreen from '../src/screens/NotificationsScreen';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

const notification = {
    _id: 'notification-1',
    title: 'Post Archived',
    message: 'Your post was archived.',
    type: 'info',
    link: '/my-posts',
    read: false,
    createdAt: new Date().toISOString(),
};

describe('NotificationsScreen', () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFocusEffects.length = 0;
        refresh.mockResolvedValue(undefined);
        (useNotifications as jest.Mock).mockReturnValue({
            notifications: [notification],
            loading: false,
            refresh,
            markAllRead: jest.fn(),
            handleNotificationClick: jest.fn(),
        });
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it('refreshes the list when the screen gains focus', async () => {
        await ReactTestRenderer.act(async () => {
            ReactTestRenderer.create(<NotificationsScreen navigation={{ goBack: jest.fn() }} />);
            await flush();
        });

        expect(mockFocusEffects.length).toBeGreaterThan(0);
        await ReactTestRenderer.act(async () => {
            mockFocusEffects[0]();
            await flush();
        });
        expect(refresh).toHaveBeenCalled();
    });

    it('loads older notifications from the section list footer', async () => {
        const loadMore = jest.fn().mockResolvedValue(undefined);
        (useNotifications as jest.Mock).mockReturnValue({
            notifications: [notification],
            loading: false,
            refresh,
            markAllRead: jest.fn(),
            handleNotificationClick: jest.fn(),
            loadMore,
            hasMore: true,
            loadingMore: false,
            loadMoreError: null,
        });

        let tree!: ReactTestRenderer.ReactTestRenderer;
        await ReactTestRenderer.act(async () => {
            tree = ReactTestRenderer.create(<NotificationsScreen navigation={{ goBack: jest.fn() }} />);
            await flush();
        });

        const list = tree.root.findByType(SectionList);
        expect(list.props.onEndReached).toBeDefined();
        await ReactTestRenderer.act(async () => {
            list.props.onEndReached();
            await flush();
        });
        expect(loadMore).toHaveBeenCalledTimes(1);

        await ReactTestRenderer.act(async () => {
            tree.unmount();
        });
    });

    it('alerts and refreshes after a delete failure', async () => {
        (api.delete as jest.Mock).mockRejectedValueOnce(new Error('not found'));

        let tree!: ReactTestRenderer.ReactTestRenderer;
        await ReactTestRenderer.act(async () => {
            tree = ReactTestRenderer.create(<NotificationsScreen navigation={{ goBack: jest.fn() }} />);
            await flush();
        });

        const deleteButton = tree.root.findAllByType(TouchableOpacity).find((node) =>
            node.findAllByType(Text).some((text) => text.props.children === 'Delete')
        );
        expect(deleteButton).toBeDefined();

        await ReactTestRenderer.act(async () => {
            deleteButton!.props.onPress();
            await flush();
        });

        expect(api.delete).toHaveBeenCalledWith('/notifications/notification-1');
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('Failed to delete'));
        expect(refresh).toHaveBeenCalled();
    });
});
