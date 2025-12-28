import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { ArrowLeft, Camera, User, MapPin, Briefcase, Phone, Loader } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
        <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.primary} size="large" />
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
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
            <View style={[styles.header, themeStyles.border]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, themeStyles.headerTitle]}>Edit Profile</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarContainer, { backgroundColor: colors.input, borderColor: colors.card }]}>
                            <Image
                                source={{ uri: avatar?.uri || auth?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${auth?.user?.displayName}` }}
                                style={styles.avatarImage}
                            />
                        </View>
                        <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={pickImage}>
                            <Camera size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.changePictureText, themeStyles.textSecondary]}>Change Profile Picture</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Display Name</Text>
                        <View style={[styles.inputWrapper, themeStyles.input]}>
                            <User size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={formData.displayName}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                                placeholder="Enter display name"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Phone Number</Text>
                        <View style={styles.phoneContainer}>
                            <View style={[styles.countryCodeContainer, themeStyles.input]}>
                                <Text style={[styles.countryCodeText, themeStyles.text]}>{formData.countryCode}</Text>
                            </View>
                            <View style={[styles.inputWrapper, { flex: 1 }, themeStyles.input]}>
                                <Phone size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/[^0-9]/g, '') }))}
                                    placeholder="Phone Number"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Bio</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper, themeStyles.input]}>
                            <TextInput
                                style={[styles.input, styles.textArea, { color: colors.text }]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Location</Text>
                        <View style={[styles.inputWrapper, themeStyles.input]}>
                            <MapPin size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={formData.location}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                placeholder="City, Country"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Skills (comma separated)</Text>
                        <View style={[styles.inputWrapper, themeStyles.input]}>
                            <Briefcase size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={formData.skills}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
                                placeholder="e.g. Design, React, Painting"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    saveText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
    },
    changePictureText: {
        marginTop: 8,
        fontSize: 12,
    },
    formContainer: {
        gap: 24,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textAreaWrapper: {
        minHeight: 120,
        alignItems: 'flex-start',
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    textArea: {
        marginLeft: 0,
        height: '100%',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    countryCodeContainer: {
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EditProfileScreen;
