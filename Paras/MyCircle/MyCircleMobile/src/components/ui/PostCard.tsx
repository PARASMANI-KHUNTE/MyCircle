import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import clsx from 'clsx'; // Assuming clsx is installed, otherwise use simple styles

const typeColors = {
    job: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    service: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
    sell: 'text-green-400 border-green-500/20 bg-green-500/10',
    rent: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
};

const PostCard = ({ post, onPress, onRequestContact, isOwnPost }) => {
    const { title, description, type, location, price, user, createdAt, images } = post;
    const typeStyle = typeColors[type] || typeColors.job;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-zinc-900 mb-4 p-4 rounded-2xl border border-white/10"
        >
            {/* Header */}
            <View className="flex-row justify-between mb-3">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                        <Image
                            source={{ uri: user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.displayName}` }}
                            className="w-full h-full"
                        />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-base">{title}</Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-zinc-400 text-xs">{user?.displayName}</Text>
                            <Text className="text-zinc-600 text-xs">•</Text>
                            <View className="flex-row items-center gap-1">
                                <Clock size={10} color="#71717a" />
                                <Text className="text-zinc-400 text-xs">{new Date(createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View className={`px-3 py-1 rounded-full border ${typeStyle.split(' ')[1]} ${typeStyle.split(' ')[2]}`}>
                    <Text className={`text-xs font-bold uppercase ${typeStyle.split(' ')[0]}`}>{type}</Text>
                </View>
            </View>

            {/* Description */}
            <Text className="text-zinc-300 mb-3 leading-5" numberOfLines={3}>{description}</Text>

            {/* Image Preview (First Image) */}
            {images && images.length > 0 && (
                <View className="h-40 w-full bg-black rounded-xl mb-3 overflow-hidden border border-white/5">
                    <Image source={{ uri: images[0] }} className="w-full h-full object-cover" resizeMode="cover" />
                </View>
            )}

            {/* Footer */}
            <View className="flex-row justify-between items-center border-t border-white/5 pt-3">
                <View className="flex-row items-center gap-1">
                    <MapPin size={14} color="#a1a1aa" />
                    <Text className="text-xs text-zinc-400">{location}</Text>
                </View>
                <Text className="text-white font-bold text-lg">₹{price || 0}</Text>
            </View>

            {/* Actions */}
            {!isOwnPost && (
                <TouchableOpacity
                    className="mt-3 bg-violet-600 py-3 rounded-xl items-center active:bg-violet-700"
                    onPress={onRequestContact}
                >
                    <Text className="text-white font-bold text-sm">Request Contact</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default PostCard;
