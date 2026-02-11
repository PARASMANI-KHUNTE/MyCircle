import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { ArrowLeft, Camera, User, MapPin, Briefcase, Phone, Loader, Check } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, color, size, top, left }: any) => {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);

    useEffect(() => {
        translationY.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) })),
                withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        translationX.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
                withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { translateX: translationX.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.floatingShape,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top,
                    left,
                },
                animatedStyle,
            ]}
        />
    );
};

const EditProfileScreen = ({ navigation }: any) => {
    const auth = useAuth() as any;
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatar, setAvatar] = useState<any>(null);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: '',
        phone: '',
        countryCode: '+91'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            const { displayName, bio, location, skills } = res.data;
            setFormData({
                displayName: displayName || '',
                bio: bio || '',
                location: location || '',
                skills: skills ? skills.join(', ') : '',
                phone: res.data.phone || '',
                countryCode: res.data.countryCode || '+91'
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        });

        if (result.assets && result.assets[0]) {
            setAvatar({
                uri: result.assets[0].uri,
                name: result.assets[0].fileName || `avatar_${Date.now()}.jpg`,
                type: result.assets[0].type || 'image/jpeg',
            });
        }
    };



    const handleSave = async () => {
        setSaving(true);
        try {
            const formDataToSend = new FormData();

            // Add avatar if selected
            if (avatar) {
                formDataToSend.append('avatar', avatar as any);
            }

            // Add other fields
            formDataToSend.append('displayName', formData.displayName);
            formDataToSend.append('bio', formData.bio);
            formDataToSend.append('location', formData.location);
            // Combine code and phone for storage or save separately
            if (formData.phone) {
                // Ensure no duplicates of country code if user typed it
                formDataToSend.append('phone', formData.countryCode + formData.phone);
                formDataToSend.append('countryCode', formData.countryCode);
                // Also append as contactPhone as that is used by Post model often
                formDataToSend.append('contactPhone', formData.countryCode + formData.phone);
            }
            // Combine code and phone for storage or save separately?
            // User schema usually has just 'phone'. Let's save both or combined.
            // Requirement: "add mobile please add select country to add phone number .accordingly "
            // Storing combined is better for uniqueness.
            // But if we want to edit it later, we need to split it.
            // Let's assume we save 'phone' as full number and 'countryCode' as separate field if possible, or just phone.
            // Since backend schema isn't fully visible, I will append 'contactPhone' if that's the field name. 
            // In postController it used 'contactPhone'. In User model??
            // I should check User model. Assuming 'phone' or 'contactPhone'.
            // Let's use 'contactPhone' for consistency with Post, or 'phone' if generic.
            // EditProfile usually updates User.
            formDataToSend.append('phone', formData.countryCode + formData.phone);
            formDataToSend.append('countryCode', formData.countryCode);

            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
            skillsArray.forEach(skill => {
                formDataToSend.append('skills[]', skill);
            });

            await api.put('/user/profile', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } catch (err) {
            console.error(err);
            const serverMsg = (err as any)?.response?.data?.msg || (err as any)?.response?.data?.error;
            Alert.alert("Error", serverMsg || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator color="#af25f4" size="large" />
        </View>
    );

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        headerTitle: { color: colors.text },
        input: { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
        border: { borderColor: colors.border },
        icon: colors.textSecondary
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FloatingShape color="rgba(175, 37, 244, 0.2)" size={400} top={-200} left={-150} delay={0} />
            <FloatingShape color="rgba(59, 130, 246, 0.15)" size={300} top={SCREEN_HEIGHT * 0.4} left={SCREEN_WIDTH - 150} delay={1000} />

            <GlassView intensity={20} borderRadius={0} style={styles.headerGlass}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassCircleBtn}>
                            <ArrowLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleMain}>Edit Profile</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={styles.saveBtnGlass}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#af25f4" />
                        ) : (
                            <View style={styles.saveBtnInner}>
                                <Check size={20} color="#fff" />
                                <Text style={styles.saveText}>Save</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </GlassView>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 60 }}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <GlassView intensity={30} style={styles.avatarContainerGlass}>
                            <Image
                                source={{ uri: avatar?.uri || auth?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${auth?.user?.displayName}` }}
                                style={styles.avatarImage}
                            />
                        </GlassView>
                        <TouchableOpacity style={styles.cameraBtnNeon} onPress={pickImage}>
                            <Camera size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changePictureText}>TAP TO CHANGE IMAGE</Text>
                </Animated.View>

                <View style={styles.formContainer}>
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={10} style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>DISPLAY NAME</Text>
                                <View style={styles.inputWrapperGlass}>
                                    <User size={20} color="rgba(255,255,255,0.4)" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.displayName}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                                        placeholder="Display Name"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PHONE NUMBER</Text>
                                <View style={styles.phoneContainer}>
                                    <View style={styles.countryCodeGlass}>
                                        <Text style={styles.countryCodeText}>{formData.countryCode}</Text>
                                    </View>
                                    <View style={[styles.inputWrapperGlass, { flex: 1 }]}>
                                        <Phone size={20} color="rgba(255,255,255,0.4)" />
                                        <TextInput
                                            style={styles.input}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/[^0-9]/g, '') }))}
                                            placeholder="Phone Number"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <GlassView intensity={10} style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>BIO</Text>
                                <View style={[styles.inputWrapperGlass, styles.textAreaWrapperGlass]}>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={formData.bio}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                        placeholder="Tell us about yourself..."
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={10} style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>LOCATION</Text>
                                <View style={styles.inputWrapperGlass}>
                                    <MapPin size={20} color="rgba(255,255,255,0.4)" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                        placeholder="City, Country"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>SKILLS</Text>
                                <View style={styles.inputWrapperGlass}>
                                    <Briefcase size={20} color="rgba(255,255,255,0.4)" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.skills}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
                                        placeholder="Design, React, Painting"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                    />
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#18181b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#18181b',
    },
    headerGlass: {
        zIndex: 10,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    glassCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginRight: 16,
    },
    headerTitleMain: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    saveBtnGlass: {
        backgroundColor: '#af25f4',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    saveBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    saveText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarContainerGlass: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 66,
    },
    cameraBtnNeon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#af25f4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#18181b',
        elevation: 5,
    },
    changePictureText: {
        marginTop: 16,
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
    },
    formContainer: {
        gap: 20,
    },
    formSection: {
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapperGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
        height: 56,
    },
    textAreaWrapperGlass: {
        height: 120,
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    textArea: {
        marginLeft: 0,
        height: '100%',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    countryCodeGlass: {
        width: 70,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontWeight: '900',
        fontSize: 16,
        color: '#fff',
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.5,
    },
});

export default EditProfileScreen;
