import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle, Pattern } from 'react-native-svg';
import { Briefcase, Wrench, ShoppingBag, Zap, MapPin, Heart, MessageCircle, Share2, Star } from 'lucide-react-native';
import { Palette } from '../../constants/design';

interface GenerativePlaceholderProps {
    id: string;
    type: string;
    style?: any;
    showIcon?: boolean;
    iconSize?: number;
    aiIcon?: string;
    aiGifKeyword?: string;
    title?: string;
    description?: string;
}

const GenerativePlaceholder = ({ id, type, style, showIcon = true, iconSize = 80, aiIcon, aiGifKeyword, title, description }: GenerativePlaceholderProps) => {
    const [fetchedIcon, setFetchedIcon] = React.useState<string | null>(null);
    const [fetchedGifKeyword, setFetchedGifKeyword] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!aiIcon && !aiGifKeyword && title) {
            const { getPlaceholderSuggestions } = require('../../services/aiService');
            getPlaceholderSuggestions(title, description || '').then((res: any) => {
                setFetchedIcon(res.icon);
                setFetchedGifKeyword(res.gifKeywords?.[0]);
            });
        }
    }, [id]);


    const getTypeColor = () => {
        switch (type?.toLowerCase()) {
            case 'job': return Palette.info;
            case 'service': return Palette.cyan[500];
            case 'sell':
            case 'rent': return Palette.warning;
            default: return Palette.pink[500];
        }
    };

    const getPseudoRandom = (seed: number) => {
        let hash = 0;
        const str = id || 'seed';
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const val = Math.abs(Math.sin(hash + seed));
        return val;
    };

    const color = getTypeColor();
    const blobs = [
        { cx: getPseudoRandom(1) * 100 + '%', cy: getPseudoRandom(2) * 100 + '%', r: getPseudoRandom(3) * 150 + 50 },
        { cx: getPseudoRandom(4) * 100 + '%', cy: getPseudoRandom(5) * 100 + '%', r: getPseudoRandom(6) * 120 + 40 },
        { cx: getPseudoRandom(7) * 100 + '%', cy: getPseudoRandom(8) * 100 + '%', r: getPseudoRandom(9) * 100 + 30 },
    ];

    const getCategoryIcon = () => {
        const iconName = aiIcon || fetchedIcon || '';
        const props = { size: iconSize, color: '#fff', opacity: 0.15 };


        // Try to match AI suggested icon name to Lucide icons
        const IconComponent = (require('lucide-react-native')[iconName] || require('lucide-react-native')[iconName.charAt(0).toUpperCase() + iconName.slice(1)]) as React.FC<any>;

        if (IconComponent) return <IconComponent {...props} />;

        switch (type?.toLowerCase()) {
            case 'job': return <Briefcase {...props} />;
            case 'service': return <Wrench {...props} />;
            case 'sell':
            case 'rent': return <ShoppingBag {...props} />;
            default: return <Zap {...props} />;
        }
    };


    return (
        <View style={[styles.container, style]}>
            <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                    <SvgLinearGradient id={`bgGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={Palette.dark.bg} stopOpacity="1" />
                    </SvgLinearGradient>
                    <Pattern id={`grid-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <Circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.05)" />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#bgGrad-${id})`} />
                {blobs.map((b, i) => (
                    <Circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={color} opacity={0.15} />
                ))}
                <Rect width="100%" height="100%" fill={`url(#grid-${id})`} />
            </Svg>
            {showIcon && (
                <View style={[StyleSheet.absoluteFill, styles.centered]}>
                    {getCategoryIcon()}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default GenerativePlaceholder;
