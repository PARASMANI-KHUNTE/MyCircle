// Mock Data and Service for Frontend-only development

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    login: async (email) => {
        await delay(500); // Simulate network latency
        return {
            data: {
                token: 'mock-jwt-token-12345',
                user: {
                    id: 'mock-user-1',
                    displayName: 'Dev User',
                    email: email || 'dev@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
                    role: 'user'
                }
            }
        };
    },

    getFeed: async () => {
        await delay(800);
        return {
            data: [
                {
                    _id: '1',
                    type: 'job',
                    title: 'Gardening Help Needed',
                    description: 'Need help trimming hedges in the backyard. Experience preferred.',
                    price: 50,
                    location: 'Downtown',
                    user: { displayName: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    type: 'sell',
                    title: 'Vintage Bicycle',
                    description: 'Fully restored 1980s road bike. Mint condition.',
                    price: 200,
                    location: 'Westside',
                    user: { displayName: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
                    createdAt: new Date().toISOString()
                }
            ]
        };
    },

    getPostById: async (id) => {
        await delay(500);
        return {
            data: {
                _id: id,
                type: 'job',
                title: 'Gardening Help Needed',
                description: 'Need help trimming hedges in the backyard. Experience preferred. Must have own tools.',
                price: 50,
                location: 'Downtown, King St.',
                images: ['https://images.unsplash.com/photo-1621532292787-5c4d284a44b5?auto=format&fit=crop&q=80&w=1000'],
                user: {
                    id: 'details-user',
                    displayName: 'Alice',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
                    rating: 4.9
                },
                createdAt: new Date().toISOString()
            }
        };
    },

    createPost: async (postData) => {
        await delay(1000);
        return {
            data: {
                _id: 'new-post-' + Date.now(),
                ...postData,
                createdAt: new Date().toISOString(),
                user: {
                    displayName: 'Dev User',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev'
                }
            }
        };
    },

    getRequests: async () => {
        await delay(600);
        return {
            data: [
                {
                    _id: 'req-1',
                    post: { title: 'Old Laptop for Sale', type: 'sell' },
                    sender: { displayName: 'John Doe', email: 'john@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
                    receiver: { id: 'current-user' },
                    status: 'pending', // pending, accepted, rejected
                    message: 'Is this still available?',
                    createdAt: new Date().toISOString()
                },
                {
                    _id: 'req-2',
                    post: { title: 'Need Dog Walker', type: 'job' },
                    sender: { id: 'current-user' },
                    receiver: { displayName: 'Pet Sitter Pro', email: 'sitter@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pet' },
                    status: 'accepted',
                    message: 'I can help with this!',
                    contactInfo: { phone: '123-456-7890', whatsapp: '123-456-7890' },
                    createdAt: new Date().toISOString()
                }
            ]
        };
    },

    updateRequestStatus: async (id, status) => {
        await delay(400);
        return {
            data: {
                _id: id,
                status: status
            }
        };
    }
};
