import api from '../../src/services/api';

const CreatePost = () => {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title || !description) return Alert.alert("Error", "Please fill all fields");

        setIsSubmitting(true);
        try {
            await api.post('/posts', {
                title,
                description,
                type: 'job', // Default for now
                location: 'Mobile Upload',
                price: 0
            });
            Alert.alert("Posted!", "Your post is live.");
            router.back();
            // Optional: Refresh feed
        } catch (err: any) {
            Alert.alert("Failed", err.response?.data?.msg || err.response?.data?.reason || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-background pt-10 px-4">
            <Text className="text-2xl font-bold text-white mb-6">Create Post</Text>

            <View className="mb-4">
                <Text className="text-gray-400 mb-2">Title</Text>
                <TextInput
                    className="bg-white/5 rounded-xl p-4 text-white border border-white/10"
                    placeholder="What do you need?"
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            <View className="mb-6">
                <Text className="text-gray-400 mb-2">Description</Text>
                <TextInput
                    className="bg-white/5 rounded-xl p-4 text-white border border-white/10 h-32"
                    placeholder="Describe details..."
                    placeholderTextColor="#666"
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            <TouchableOpacity
                onPress={handleSubmit}
                className="bg-primary py-4 rounded-xl items-center"
            >
                <Text className="text-white font-bold text-lg">Publish Post</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default CreatePost;
