const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

// Local coordinates near Bilaspur/Bhilai where the user's post is:
// Longitude: 82.1485, Latitude: 22.1858
const BASE_LNG = 82.1485;
const BASE_LAT = 22.1858;

// Function to generate slight offsets so pins aren't exactly on top of each other
const getOffsetLocation = () => {
    const offsetLng = (Math.random() - 0.5) * 0.05; // +/- 0.025 deg
    const offsetLat = (Math.random() - 0.5) * 0.05; 
    return [BASE_LNG + offsetLng, BASE_LAT + offsetLat];
};

const dummyPosts = [
    {
        type: 'sell',
        itemCategory: 'electronics',
        title: 'MacBook Pro M1 2020 - Excellent Condition',
        description: 'Selling my MacBook Pro M1, 8GB RAM, 256GB SSD. Barely used, no scratches. Comes with original charger and box.',
        price: 80000,
        location: 'Bilaspur, Chhattisgarh, India',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
        isUrgent: false,
        exchangePreference: 'money',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800']
    },
    {
        type: 'rent',
        itemCategory: 'other',
        title: 'Spacious 2BHK Apartment for Rent',
        description: 'Fully furnished 2BHK apartment available for rent. Includes AC, washing machine, fridge, and power backup. Gym and swimming pool in the society.',
        price: 15000,
        location: 'Nehru Nagar, Bilaspur',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1e5250ce0e?auto=format&fit=crop&q=80&w=800']
    },
    {
        type: 'job',
        itemCategory: '',
        title: 'Urgently Looking for a Frontend Developer (React)',
        description: 'We are a fast-growing startup looking for a skilled Frontend Developer with 2+ years of experience in React.js and TailwindCSS. Remote work allowed.',
        budgetMin: 30000,
        budgetMax: 50000,
        location: 'Remote / Bilaspur',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
        isUrgent: true,
    },
    {
        type: 'service',
        itemCategory: '',
        title: 'Professional Photography Service',
        description: 'Offering professional photography services for events, weddings, and portfolio shoots. Have over 5 years of experience. Contact for portfolio and rates.',
        price: 5000,
        location: 'Civil Lines, Bilaspur',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
    },
    {
        type: 'barter',
        itemCategory: 'electronics',
        title: 'Exchange PS5 for Xbox Series X',
        description: 'I have a pristine PS5 disk edition with 2 controllers. Want to exchange it for an Xbox Series X. Let me know if interested.',
        acceptsBarter: true,
        exchangePreference: 'barter',
        barterPreferences: 'Xbox Series X',
        location: 'Rajendra Nagar, Bilaspur',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800']
    },
    {
        type: 'request',
        itemCategory: 'other',
        title: 'Need a Math Tutor for 10th Grade',
        description: 'Looking for a private math tutor for my son in 10th grade (CBSE). Classes need to be in-person, 3 days a week.',
        budgetMin: 3000,
        budgetMax: 5000,
        location: 'Mopka, Bilaspur',
        locationCoords: {
            type: 'Point',
            coordinates: getOffsetLocation()
        },
        status: 'active',
        isActive: true,
    }
];

const seedData = async () => {
    try {
        await connectDB();
        
        let user = await User.findOne({ displayName: 'Jane Doe' });
        if (!user) {
            user = await User.findOne();
        }
        
        console.log(`Using user: ${user.displayName} (${user._id})`);
        
        // Remove the previously seeded posts that were out of location bounds
        const deletedPosts = await Post.deleteMany({
            title: { $in: dummyPosts.map(p => p.title) }
        });
        console.log(`Deleted ${deletedPosts.deletedCount} old out-of-bounds dummy posts.`);
        
        const postsToInsert = dummyPosts.map(post => ({
            ...post,
            user: user._id,
            expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 28 days from now
        }));
        
        const result = await Post.insertMany(postsToInsert);
        console.log(`Successfully inserted ${result.length} dummy posts near your location!`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
