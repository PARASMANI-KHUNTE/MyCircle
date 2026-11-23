jest.mock('../src/context/ThemeContext', () => ({
    useTheme: () => ({
        colors: { card: '#111111', text: '#ffffff', primary: '#af25f4' },
    }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import ImagePreviewModal from '../src/components/ui/ImagePreviewModal';

const images = ['one.jpg', 'two.jpg', 'three.jpg'];

const getMainImageUri = (tree: ReactTestRenderer.ReactTestRenderer): string | undefined => {
    const mainImage = tree.root.findAllByType(Image).find((node) => node.props.resizeMode === 'contain');
    return mainImage?.props.source?.uri;
};

const render = (props: {
    visible: boolean;
    images: string[];
    initialIndex: number;
}) => ReactTestRenderer.create(
    <ImagePreviewModal {...props} onClose={() => {}} />
);

describe('ImagePreviewModal', () => {
    it('syncs the selected index when the modal opens after the parent changes it', () => {
        let tree!: ReactTestRenderer.ReactTestRenderer;

        ReactTestRenderer.act(() => {
            tree = render({ visible: false, images, initialIndex: 0 });
        });
        ReactTestRenderer.act(() => {
            tree.update(<ImagePreviewModal visible images={images} initialIndex={2} onClose={() => {}} />);
        });

        expect(getMainImageUri(tree)).toBe('three.jpg');
        const counter = tree.root.findAllByType(Text).find((node) => {
            const children = node.props.children;
            return Array.isArray(children) && children.join('') === '3 / 3';
        });
        expect(counter).toBeDefined();
    });

    it('clamps out-of-range indexes to the available images', () => {
        let tree!: ReactTestRenderer.ReactTestRenderer;

        ReactTestRenderer.act(() => {
            tree = render({ visible: true, images: ['one.jpg'], initialIndex: 5 });
        });

        expect(getMainImageUri(tree)).toBe('one.jpg');

        ReactTestRenderer.act(() => {
            tree.update(<ImagePreviewModal visible images={images} initialIndex={1} onClose={() => {}} />);
        });

        expect(getMainImageUri(tree)).toBe('two.jpg');
    });
});
