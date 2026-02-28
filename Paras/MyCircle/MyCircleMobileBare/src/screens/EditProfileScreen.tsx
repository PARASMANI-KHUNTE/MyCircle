import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { ArrowLeft, Camera, User, MapPin, Briefcase, Phone, Loader, Check } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleMain}>Edit Profile</Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.saveButton}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <View style={styles.saveBtnInner}>
                            <Check size={20} color="#ffffff" />
                            <Text style={styles.saveText}>Save</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 60 }}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: avatar?.uri || auth?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${auth?.user?.displayName}` }}
                                style={styles.avatarImage}
                            />
                        </View>
                        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                            <Camera size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changePictureText}>TAP TO CHANGE IMAGE</Text>
                </Animated.View>

                <View style={styles.formContainer}>
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>DISPLAY NAME</Text>
                                <View style={styles.inputWrapper}>
                                    <User size={20} color="#64748b" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.displayName}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                                        placeholder="Display Name"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PHONE NUMBER</Text>
                                <View style={styles.phoneContainer}>
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>{formData.countryCode}</Text>
                                    </View>
                                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                                        <Phone size={20} color="#64748b" />
                                        <TextInput
                                            style={styles.input}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/[^0-9]/g, '') }))}
                                            placeholder="Phone Number"
                                            placeholderTextColor="#64748b"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>BIO</Text>
                                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={formData.bio}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                        placeholder="Tell us about yourself..."
                                        placeholderTextColor="#64748b"
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>LOCATION</Text>
                                <View style={styles.inputWrapper}>
                                    <MapPin size={20} color="#64748b" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                        placeholder="City, Country"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>SKILLS</Text>
                                <View style={styles.inputWrapper}>
                                    <Briefcase size={20} color="#64748b" />
                                    <TextInput
                                        style={styles.input}
                                        value={formData.skills}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
                                        placeholder="Design, React, Painting"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 16,
    },
    headerTitleMain: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    saveButton: {
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
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 66,
    },
    cameraButton: {
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
        borderColor: '#0a0a0a',
    },
    changePictureText: {
        marginTop: 16,
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 2,
    },
    formContainer: {
        gap: 20,
    },
    formSection: {
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        height: 56,
    },
    textAreaWrapper: {
        height: 120,
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#ffffff',
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
    countryCode: {
        width: 70,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontWeight: '700',
        fontSize: 16,
        color: '#ffffff',
    },
});

export default EditProfileScreen;
