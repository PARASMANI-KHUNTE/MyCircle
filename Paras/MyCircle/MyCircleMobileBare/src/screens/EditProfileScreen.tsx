import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { ArrowLeft, Camera, User, MapPin, Briefcase } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation }: any) => {
    const auth = useAuth() as any;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatar, setAvatar] = useState<any>(null);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: ''
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
                skills: skills ? skills.join(', ') : ''
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
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: avatar?.uri || auth?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${auth?.user?.displayName}` }}
                                style={styles.avatarImage}
                            />
                        </View>
                        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                            <Camera size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changePictureText}>Change Profile Picture</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Display Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color="#71717a" />
                            <TextInput
                                style={styles.input}
                                value={formData.displayName}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                                placeholder="Enter display name"
                                placeholderTextColor="#3f3f46"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor="#3f3f46"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={20} color="#71717a" />
                            <TextInput
                                style={styles.input}
                                value={formData.location}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                placeholder="City, Country"
                                placeholderTextColor="#3f3f46"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Skills (comma separated)</Text>
                        <View style={styles.inputWrapper}>
                            <Briefcase size={20} color="#71717a" />
                            <TextInput
                                style={styles.input}
                                value={formData.skills}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
                                placeholder="e.g. Design, React, Painting"
                                placeholderTextColor="#3f3f46"
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
        backgroundColor: '#000000',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
        color: '#ffffff',
    },
    saveText: {
        color: '#8b5cf6', // violet-500
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
        backgroundColor: '#27272a', // zinc-800
        borderWidth: 4,
        borderColor: '#18181b', // zinc-900
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
        backgroundColor: '#7c3aed', // violet-600
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#000000',
    },
    changePictureText: {
        color: '#71717a', // zinc-500
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
        color: '#a1a1aa', // zinc-400
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b', // zinc-900
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textAreaWrapper: {
        minHeight: 120,
        alignItems: 'flex-start',
    },
    input: {
        flex: 1,
        color: '#ffffff',
        marginLeft: 8,
        fontSize: 16,
    },
    textArea: {
        marginLeft: 0,
        height: '100%',
    },
});

export default EditProfileScreen;
