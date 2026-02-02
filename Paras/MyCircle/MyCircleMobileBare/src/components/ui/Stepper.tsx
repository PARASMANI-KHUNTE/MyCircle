import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react-native';

interface StepperProps {
    currentStep: number;
    steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <View key={index} style={[styles.stepWrapper, !isActive && { flex: 0 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* Circle */}
                            <View style={[
                                styles.circle,
                                isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } :
                                    isCompleted ? { backgroundColor: colors.success, borderColor: colors.success } :
                                        { backgroundColor: 'transparent', borderColor: colors.border }
                            ]}>
                                {isCompleted ? (
                                    <Check size={12} color="#ffffff" />
                                ) : (
                                    <Text style={[
                                        styles.stepNum,
                                        (isActive || isCompleted) ? { color: '#ffffff' } : { color: colors.textSecondary }
                                    ]}>
                                        {stepNum}
                                    </Text>
                                )}
                            </View>

                            {/* Label - Only show if active or if few steps to save space */}
                            {(isActive || steps.length <= 3) && (
                                <Text style={[
                                    styles.label,
                                    isActive ? { color: colors.text, fontWeight: 'bold' } : { color: colors.textSecondary }
                                ]} numberOfLines={1}>
                                    {label}
                                </Text>
                            )}
                        </View>

                        {/* Line connector (except for last item) */}
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.line,
                                { backgroundColor: isCompleted ? colors.success : colors.border },
                                !isActive && steps.length > 3 && { minWidth: 20 }
                            ]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 24,
        width: '100%',
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    stepNum: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 11,
        marginRight: 4,
    },
    line: {
        height: 2,
        flex: 1,
        marginHorizontal: 4,
    }
});

export default Stepper;
