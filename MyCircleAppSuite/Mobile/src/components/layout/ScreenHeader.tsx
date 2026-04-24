import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';

type ScreenHeaderProps = {
    title: string;
    onBack?: () => void;
    right?: React.ReactNode;
};

const ScreenHeader = ({ title, onBack, right }: ScreenHeaderProps) => {
    const { colors } = useTheme();

    return (
        <View style={styles.header}>
            <View style={styles.leftSlot}>
                {onBack ? (
                    <TouchableOpacity
                        onPress={onBack}
                        activeOpacity={0.85}
                        style={[
                            styles.backButton,
                            {
                                backgroundColor: colors.backdrop,
                                borderColor: colors.borderStrong,
                            },
                        ]}
                    >
                        <ArrowLeft size={22} color={colors.text} />
                    </TouchableOpacity>
                ) : null}
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.rightSlot}>{right}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    leftSlot: {
        width: 60,
        alignItems: 'flex-start',
    },
    rightSlot: {
        minWidth: 60,
        alignItems: 'flex-end',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    title: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
});

export default ScreenHeader;
