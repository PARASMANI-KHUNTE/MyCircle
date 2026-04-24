import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';

interface StepperProps {
    currentStep: number;
    steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.backdrop, borderColor: colors.borderSoft }]}>
            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <View key={label} style={[styles.stepWrapper, !isActive && { flex: 0 }]}>
                        <View style={styles.stepRow}>
                            <View
                                style={[
                                    styles.circle,
                                    isActive
                                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                        : isCompleted
                                            ? { backgroundColor: colors.success, borderColor: colors.success }
                                            : { backgroundColor: 'transparent', borderColor: colors.border },
                                ]}
                            >
                                {isCompleted ? (
                                    <Check size={12} color={colors.white} />
                                ) : (
                                    <Text style={[styles.stepNum, { color: isActive ? colors.white : colors.textSecondary }]}>
                                        {stepNum}
                                    </Text>
                                )}
                            </View>

                            {isActive || steps.length <= 3 ? (
                                <Text style={[styles.label, { color: isActive ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                                    {label}
                                </Text>
                            ) : null}
                        </View>

                        {index < steps.length - 1 ? (
                            <View style={[styles.line, { backgroundColor: isCompleted ? colors.success : colors.border }, !isActive && steps.length > 3 && { minWidth: 20 }]} />
                        ) : null}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 24,
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    stepNum: {
        fontSize: 12,
        fontWeight: '900',
    },
    label: {
        fontSize: 12,
        marginRight: 8,
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    line: {
        height: 2,
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 1,
    },
});

export default Stepper;
