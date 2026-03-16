import React, { useState } from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Text } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewModalProps {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    visible,
    images,
    initialIndex = 0,
    onClose
}) => {
    const { colors } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {/* Close Button */}
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: colors.card + 'CC' }]}
                    onPress={onClose}
                >
                    <X size={24} color={colors.text} />
                </TouchableOpacity>

                {/* Image Counter */}
                {images.length > 1 && (
                    <View style={[styles.counterContainer, { backgroundColor: colors.card + 'CC' }]}>
                        <Text style={[styles.counterText, { color: colors.text }]}>
                            {currentIndex + 1} / {images.length}
                        </Text>
                    </View>
                )}

                {/* Main Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: images[currentIndex] }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <TouchableOpacity
                            style={[styles.navButton, styles.navButtonLeft, { backgroundColor: colors.card + 'CC' }]}
                            onPress={goToPrevious}
                        >
                            <ChevronLeft size={32} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, styles.navButtonRight, { backgroundColor: colors.card + 'CC' }]}
                            onPress={goToNext}
                        >
                            <ChevronRight size={32} color={colors.text} />
                        </TouchableOpacity>
                    </>
                )}

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                    <View style={styles.thumbnailContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailScroll}
                        >
                            {images.map((img, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setCurrentIndex(idx)}
                                    style={[
                                        styles.thumbnail,
                                        currentIndex === idx && { borderColor: colors.primary, borderWidth: 3 }
                                    ]}
                                >
                                    <Image
                                        source={{ uri: img }}
                                        style={styles.thumbnailImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    counterContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    counterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    navButton: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        top: '50%',
        marginTop: -25,
    },
    navButtonLeft: {
        left: 20,
    },
    navButtonRight: {
        right: 20,
    },
    thumbnailContainer: {
        position: 'absolute',
        bottom: 30,
        width: SCREEN_WIDTH,
    },
    thumbnailScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
});

export default ImagePreviewModal;
