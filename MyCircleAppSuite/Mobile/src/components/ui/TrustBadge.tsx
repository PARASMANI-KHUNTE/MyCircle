import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ShieldAlert, ShieldCheck, Star } from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';
import GlassView from './GlassView';

interface TrustBadgeProps {
    score: number;
    isVerified?: boolean;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
    score = 50,
    isVerified = false,
    size = 'medium',
    showLabel = false,
}) => {
    const { colors } = useTheme();

    let badgeColor = colors.textSecondary;
    let BadgeIcon = Star;
    if (score >= 80) {
        badgeColor = colors.success;
        BadgeIcon = ShieldCheck;
    } else if (score >= 50) {
        badgeColor = colors.warning;
        BadgeIcon = ShieldCheck;
    } else {
        badgeColor = colors.danger;
        BadgeIcon = ShieldAlert;
    }

    const sizeConfig = {
        small: { icon: 14, text: 10, padding: 4 },
        medium: { icon: 18, text: 14, padding: 6 },
        large: { icon: 32, text: 24, padding: 12 },
    };

    const config = sizeConfig[size];
    const activeColor = isVerified ? colors.success : badgeColor;

    return (
        <GlassView
            intensity={isVerified ? 30 : 15}
            style={[
                styles.container,
                {
                    padding: config.padding,
                    borderColor: activeColor,
                    borderWidth: 1.5,
                },
            ]}
        >
            <BadgeIcon size={config.icon} color={activeColor} />
            <Text style={[styles.score, { fontSize: config.text, color: activeColor }]}>{score}</Text>
            {showLabel ? (
                <Text style={[styles.label, { color: colors.textMuted }]}>Trust Score</Text>
            ) : null}
        </GlassView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        gap: 4,
        alignSelf: 'flex-start',
    },
    score: {
        fontWeight: '700',
    },
    label: {
        fontSize: 10,
        marginLeft: 4,
    },
});

export default TrustBadge;
