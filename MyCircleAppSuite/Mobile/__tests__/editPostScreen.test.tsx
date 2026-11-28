const mockAlertProps: any = {};
const mockNavigationListeners: Record<string, Array<(event: any) => void>> = {};

jest.mock('../src/components/ui/ThemedAlert', () => ({
    __esModule: true,
    default: (props: any) => {
        Object.assign(mockAlertProps, props);
        return null;
    },
}));

jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn(), put: jest.fn() },
}));

jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn().mockResolvedValue({ assets: [] }),
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
            View, Text, Image, ScrollView,
            createAnimatedComponent: (Component: any) => Component,
        },
        FadeInDown: chain,
        FadeInUp: chain,
    };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import api from '../src/services/api';
import EditPostScreen from '../src/screens/EditPostScreen';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

const storedPost = {
    _id: 'post-1',
    title: 'Need a plumber',
    description: 'Kitchen sink is leaking',
    type: 'job',
    location: 'Connaught Place',
    locationCoords: { coordinates: [77.209, 28.6139] },
    price: 500,
    acceptsBarter: false,
    duration: 10080,
    images: ['https://example.com/a.jpg'],
};

const formDataEntries = (formData: any): Array<[string, any]> => {
    if (typeof formData.getParts === 'function') return formData.getParts();
    if (Array.isArray(formData._parts)) return formData._parts;
    if (typeof formData.entries === 'function') return Array.from(formData.entries()) as Array<[string, any]>;
    return [];
};

const findSaveButton = (tree: ReactTestRenderer.ReactTestRenderer) =>
    tree.root.findAllByType(TouchableOpacity).find((node) => node.props.disabled !== undefined);

const findButtonByText = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
    tree.root.findAllByType(TouchableOpacity).find((node) =>
        node.findAllByType(Text).some((text) => text.props.children === label)
    );

describe('EditPostScreen', () => {
    const navigation = {
        addListener: jest.fn((event: string, callback: (event: any) => void) => {
            mockNavigationListeners[event] = [...(mockNavigationListeners[event] || []), callback];
            return () => {
                mockNavigationListeners[event] = (mockNavigationListeners[event] || []).filter((cb) => cb !== callback);
            };
        }),
        dispatch: jest.fn(),
        goBack: jest.fn(),
    };

    const mount = async () => {
        let tree!: ReactTestRenderer.ReactTestRenderer;
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        await ReactTestRenderer.act(async () => {
            tree = ReactTestRenderer.create(
                <QueryClientProvider client={queryClient}>
                    <EditPostScreen navigation={navigation} route={{ params: { id: 'post-1' } }} />
                </QueryClientProvider>
            );
            await flush();
        });
        return tree;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        for (const key of Object.keys(mockNavigationListeners)) delete mockNavigationListeners[key];
        Object.keys(mockAlertProps).forEach((key) => delete mockAlertProps[key]);
        (api.get as jest.Mock).mockResolvedValue({ data: storedPost });
        (api.put as jest.Mock).mockResolvedValue({ data: storedPost });
    });

    it('loads the post by route id and saves without renewing expiry', async () => {
        const tree = await mount();

        expect(api.get).toHaveBeenCalledWith('/posts/post-1');

        const save = findSaveButton(tree)!;
        await ReactTestRenderer.act(async () => {
            save.props.onPress();
            await flush();
        });

        expect(api.put).toHaveBeenCalledWith('/posts/post-1', expect.anything(), expect.anything());
        const entries = formDataEntries((api.put as jest.Mock).mock.calls[0][1]);
        expect(entries).toEqual(expect.arrayContaining([
            ['title', 'Need a plumber'],
            ['location', 'Connaught Place'],
        ]));
        expect(entries.some(([key]) => key === 'duration')).toBe(false);
    });

    it('sends duration when the user changes it', async () => {
        const tree = await mount();

        const sevenDays = findButtonByText(tree, '7 Days')!;
        ReactTestRenderer.act(() => sevenDays.props.onPress());

        const save = findSaveButton(tree)!;
        await ReactTestRenderer.act(async () => {
            save.props.onPress();
            await flush();
        });

        const entries = formDataEntries((api.put as jest.Mock).mock.calls[0][1]);
        expect(entries).toEqual(expect.arrayContaining([['duration', '10080']]));
    });

    it('prompts before discarding unsaved edits', async () => {
        const tree = await mount();

        const titleInput = tree.root.findAllByType(TextInput)[0];
        ReactTestRenderer.act(() => titleInput.props.onChangeText('Updated title'));

        const beforeRemove = mockNavigationListeners.beforeRemove[0];
        const event = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
        ReactTestRenderer.act(() => beforeRemove(event));

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockAlertProps.title).toBe('Discard Changes?');

        ReactTestRenderer.act(() => mockAlertProps.onConfirm());
        expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    });
});
