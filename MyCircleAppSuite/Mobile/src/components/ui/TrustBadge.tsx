import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ShieldCheck, ShieldAlert, Star } from 'lucide-react-native';
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
    showLabel = false
}) => {
    const { colors } = useTheme();

    // Determine color and icon based on score
    let badgeColor = colors.textSecondary;
    let BadgeIcon = Star;

    if (score >= 80) {
        badgeColor = '#10B981'; // Emerald Green
        BadgeIcon = ShieldCheck;
    } else if (score >= 50) {
        badgeColor = '#F59E0B'; // Amber
        BadgeIcon = ShieldCheck;
    } else {
        badgeColor = '#EF4444'; // Red
        BadgeIcon = ShieldAlert;
    }

    // Size configurations
    const sizeConfig = {
        small: { icon: 14, text: 10, padding: 4 },
        medium: { icon: 18, text: 14, padding: 6 },
        large: { icon: 32, text: 24, padding: 12 }
    };

    const config = sizeConfig[size];

    return (
        <GlassView
            intensity={isVerified ? 30 : 15}
            style={[styles.container, {
                padding: config.padding,
                borderColor: isVerified ? '#10B981' : badgeColor + '40',
                borderWidth: 1.5
            }]}
        >
            <BadgeIcon size={config.icon} color={isVerified ? '#10B981' : badgeColor} />
            <Text style={[styles.score, {
                fontSize: config.text,
                color: isVerified ? '#10B981' : badgeColor
            }]}>
                {score}
            </Text>
            {showLabel && (
                <Text style={[styles.label, { color: 'rgba(255,255,255,0.4)' }]}>
                    Trust Score
                </Text>
            )}
        </GlassView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        gap: 4,
        alignSelf: 'flex-start'
    },
    score: {
        fontWeight: 'bold',
    },
    label: {
        fontSize: 10,
        marginLeft: 4
    }
});

export default TrustBadge;
