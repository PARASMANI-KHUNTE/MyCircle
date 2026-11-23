const mockUsePosts = jest.fn();

jest.mock('../src/hooks/usePosts', () => ({
    usePosts: (options: any) => mockUsePosts(options),
    prependPostToFeed: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ setQueryData: jest.fn() }),
}));

jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({ colors: new Proxy({}, { get: () => '#ffffff' }), isDark: true }),
}));

jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock('../src/context/SocketContext', () => ({ useSocket: () => ({ socket: null }) }));
jest.mock('../src/context/NotificationContext', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
jest.mock('../src/context/LocationContext', () => ({
    useLocation: () => ({ location: null, requestLocation: jest.fn().mockResolvedValue(null) }),
}));

jest.mock('../src/components/ui/Toast', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() }),
}));

jest.mock('react-native-reanimated', () => {
    const { View, Text, Image, ScrollView } = require('react-native');
    const chain: any = {
        delay: () => chain,
        duration: () => chain,
        springify: () => chain,
    };
    return {
        __esModule: true,
        default: {
            View,
            Text,
            Image,
            ScrollView,
            createAnimatedComponent: (Component: any) => Component,
        },
        FadeInDown: chain,
    };
});

jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn().mockResolvedValue({ data: { count: 0 } }) },
}));

jest.mock('../src/components/layout/AppScreen', () => {
    const React = require('react');
    const { View } = require('react-native');
    return { __esModule: true, default: ({ children }: any) => React.createElement(View, null, children) };
});

jest.mock('../src/components/ui/PostCard', () => {
    const React = require('react');
    const { View } = require('react-native');
    return { __esModule: true, default: () => React.createElement(View) };
});

jest.mock('@shopify/flash-list', () => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return {
        FlashList: ({ data, renderItem, ListEmptyComponent, ListFooterComponent, onEndReached }: any) => React.createElement(
            View,
            null,
            ListEmptyComponent
                ? (typeof ListEmptyComponent === 'function'
                    ? React.createElement(ListEmptyComponent)
                    : ListEmptyComponent)
                : null,
            ...(data || []).map((item: any, index: number) => renderItem({ item, index })),
            ListFooterComponent
                ? (typeof ListFooterComponent === 'function'
                    ? React.createElement(ListFooterComponent)
                    : ListFooterComponent)
                : null,
            React.createElement(
                TouchableOpacity,
                { testID: 'feed-load-more', onPress: onEndReached },
                React.createElement(Text, null, 'trigger-load-more')
            )
        ),
    };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import FeedScreen from '../src/screens/FeedScreen';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const findButtonByText = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
    tree.root.findAllByType(TouchableOpacity).find((node) =>
        node.findAllByType(Text).some((text) => text.props.children === label)
    );

describe('FeedScreen filters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePosts.mockReturnValue({
            data: [],
            isLoading: false,
            refetch: jest.fn(),
            isRefetching: false,
            isError: false,
            hasMore: false,
            fetchMore: jest.fn(),
            isFetchingMore: false,
        });
    });

    it('debounces search and resets every filter from the empty state', async () => {
        let tree!: ReactTestRenderer.ReactTestRenderer;
        await ReactTestRenderer.act(async () => {
            tree = ReactTestRenderer.create(
                <FeedScreen navigation={{ navigate: jest.fn() }} route={{ params: {} }} />
            );
            await flush();
        });

        const searchInput = tree.root.findAllByType(TextInput)
            .find((node) => node.props.placeholder === 'Search products, services, barter...')!;

        ReactTestRenderer.act(() => {
            searchInput.props.onChangeText('plumber');
        });
        expect(tree.root.findAllByType(TextInput)
            .find((node) => node.props.placeholder === 'Search products, services, barter...')?.props.value
        ).toBe('plumber');

        await wait(350);
        await ReactTestRenderer.act(async () => {
            await flush();
        });

        expect(mockUsePosts).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'plumber' }));

        const urgentChip = findButtonByText(tree, 'Urgent')!;
        await ReactTestRenderer.act(async () => {
            urgentChip.props.onPress();
            await flush();
        });
        expect(mockUsePosts).toHaveBeenLastCalledWith(expect.objectContaining({ urgentOnly: true }));

        const resetButton = findButtonByText(tree, 'Reset Filters')!;
        await ReactTestRenderer.act(async () => {
            resetButton.props.onPress();
            await flush();
        });

        expect(mockUsePosts).toHaveBeenLastCalledWith(expect.objectContaining({
            q: undefined,
            urgentOnly: false,
            type: 'all',
            location: undefined,
            latitude: undefined,
        }));

        await ReactTestRenderer.act(async () => {
            tree.unmount();
            await flush();
        });
    });

    it('requests the next page from the list footer and exposes the end state', async () => {
        const fetchMore = jest.fn().mockResolvedValue(undefined);
        mockUsePosts.mockReturnValue({
            data: [],
            isLoading: false,
            refetch: jest.fn(),
            isRefetching: false,
            isError: false,
            hasMore: true,
            fetchMore,
            isFetchingMore: false,
        });

        let tree!: ReactTestRenderer.ReactTestRenderer;
        await ReactTestRenderer.act(async () => {
            tree = ReactTestRenderer.create(
                <FeedScreen navigation={{ navigate: jest.fn() }} route={{ params: {} }} />
            );
            await flush();
        });

        const trigger = tree.root.findByProps({ testID: 'feed-load-more' });
        await ReactTestRenderer.act(async () => {
            trigger.props.onPress();
            await flush();
        });
        expect(fetchMore).toHaveBeenCalledTimes(1);

        mockUsePosts.mockReturnValue({
            data: [{ _id: 'post-1', type: 'sell', createdAt: new Date().toISOString() }],
            isLoading: false,
            refetch: jest.fn(),
            isRefetching: false,
            isError: false,
            hasMore: false,
            fetchMore,
            isFetchingMore: false,
        });
        await ReactTestRenderer.act(async () => {
            tree.update(
                <FeedScreen navigation={{ navigate: jest.fn() }} route={{ params: {} }} />
            );
            await flush();
        });
        expect(tree.root.findAllByType(Text).some((node) =>
            node.props.children === "You're all caught up"
        )).toBe(true);

        await ReactTestRenderer.act(async () => {
            tree.unmount();
            await flush();
        });
    });
});
