jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({ colors: new Proxy({}, { get: () => '#ffffff' }) }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import PaginationFooter from '../src/components/ui/PaginationFooter';

describe('PaginationFooter', () => {
    it('shows an explicit end-of-list state', () => {
        let tree!: ReactTestRenderer.ReactTestRenderer;
        ReactTestRenderer.act(() => {
            tree = ReactTestRenderer.create(
                <PaginationFooter hasMore={false} endText="Beginning of conversation" />
            );
        });

        expect(tree.root.findAllByType(Text).some((node) =>
            node.props.children === 'Beginning of conversation'
        )).toBe(true);
        ReactTestRenderer.act(() => tree.unmount());
    });

    it('shows a retry action instead of a loading row on error', () => {
        const onRetry = jest.fn();
        let tree!: ReactTestRenderer.ReactTestRenderer;
        ReactTestRenderer.act(() => {
            tree = ReactTestRenderer.create(
                <PaginationFooter hasMore={true} error="Failed to load more" onRetry={onRetry} />
            );
        });

        const retry = tree.root.findAllByType(TouchableOpacity)
            .find((node) => node.findAllByType(Text).some((text) => text.props.children === 'Retry'));
        expect(retry).toBeDefined();
        ReactTestRenderer.act(() => retry!.props.onPress());
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(tree.root.findAllByType(Text).some((node) =>
            node.props.children === 'Failed to load more'
        )).toBe(true);
        ReactTestRenderer.act(() => tree.unmount());
    });
});
