jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            card: '#111111',
            border: '#333333',
            text: '#ffffff',
            textSecondary: '#aaaaaa',
            primary: '#af25f4',
        },
    }),
}));

import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import RateRequestModal from '../src/components/ui/RateRequestModal';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

const findButtonByLabel = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
    tree.root.findAllByType(TouchableOpacity).find((node) => node.props.accessibilityLabel === label);

const findButtonByText = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
    tree.root.findAllByType(TouchableOpacity).find((node) =>
        node.findAllByType(Text).some((textNode) => textNode.props.children === label)
    );

describe('RateRequestModal', () => {
    it('submits the selected score and optional review', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        const onClose = jest.fn();
        let tree!: ReactTestRenderer.ReactTestRenderer;

        ReactTestRenderer.act(() => {
            tree = ReactTestRenderer.create(
                <RateRequestModal
                    visible
                    request={{ _id: 'request-1', counterparty: { displayName: 'Asha' } }}
                    onClose={onClose}
                    onSubmit={onSubmit}
                />
            );
        });

        const fourStars = findButtonByLabel(tree, '4 stars') as ReactTestInstance;
        ReactTestRenderer.act(() => fourStars.props.onPress());

        const submit = findButtonByText(tree, 'Submit rating') as ReactTestInstance;
        await ReactTestRenderer.act(async () => {
            submit.props.onPress();
            await flush();
        });

        expect(onSubmit).toHaveBeenCalledWith('request-1', 4, '');
        expect(onClose).toHaveBeenCalled();
    });

    it('does not submit without a score', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        let tree!: ReactTestRenderer.ReactTestRenderer;

        ReactTestRenderer.act(() => {
            tree = ReactTestRenderer.create(
                <RateRequestModal
                    visible
                    request={{ _id: 'request-1' }}
                    onClose={() => {}}
                    onSubmit={onSubmit}
                />
            );
        });

        const submit = findButtonByText(tree, 'Submit rating') as ReactTestInstance;
        expect(submit.props.disabled).toBe(true);

        await ReactTestRenderer.act(async () => {
            submit.props.onPress();
            await flush();
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
