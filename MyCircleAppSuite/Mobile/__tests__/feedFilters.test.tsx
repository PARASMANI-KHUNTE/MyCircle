const mockUsePosts = jest.fn();

jest.mock('../src/hooks/usePosts', () => ({ usePosts: (options: any) => mockUsePosts(options) }));

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
    const { View } = require('react-native');
    return {
        FlashList: ({ data, renderItem, ListEmptyComponent }: any) => React.createElement(
            View,
            null,
            ListEmptyComponent
                ? (typeof ListEmptyComponent === 'function'
                    ? React.createElement(ListEmptyComponent)
                    : ListEmptyComponent)
                : null,
            ...(data || []).map((item: any, index: number) => renderItem({ item, index }))
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
});
