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
                    <View key={index} style={styles.stepWrapper}>
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

                            {/* Label (Only shown if active or next, to save space, or just show all but allow wrapping usually better to keep it simple) */}
                            {/* Design shows labels next to numbers. Let's show label. */}
                            <Text style={[
                                styles.label,
                                isActive ? { color: colors.text, fontWeight: 'bold' } : { color: colors.textSecondary }
                            ]}>
                                {label}
                            </Text>
                        </View>

                        {/* Line connector (except for last item) */}
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.line,
                                { backgroundColor: isCompleted ? colors.success : colors.border }
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
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 24,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Distribute space
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    stepNum: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 12,
        marginRight: 8,
    },
    line: {
        height: 2,
        flex: 1,
        marginRight: 8,
    }
});

export default Stepper;
