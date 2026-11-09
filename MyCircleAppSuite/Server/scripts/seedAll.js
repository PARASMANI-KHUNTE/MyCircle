const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Wallet = require('../src/models/Wallet');
const Notification = require('../src/models/Notification');
const ContactRequest = require('../src/models/ContactRequest');

const BASE_LNG = 82.1485;
const BASE_LAT = 22.1858;

const getOffsetLocation = (variance = 0.04) => {
    const offsetLng = (Math.random() - 0.5) * variance;
    const offsetLat = (Math.random() - 0.5) * variance;
    return [
        parseFloat((BASE_LNG + offsetLng).toFixed(6)),
        parseFloat((BASE_LAT + offsetLat).toFixed(6)),
    ];
};

const peerSeedData = [
    {
        email: 'aarav.dev@mycircle.community',
        displayName: 'Aarav Sharma',
        firstName: 'Aarav',
        lastName: 'Sharma',
        bio: 'Senior full-stack developer & open-source contributor. Tech and audio enthusiast.',
        location: 'Vyapar Vihar, Bilaspur',
        skills: ['React', 'Node.js', 'Next.js', 'Cloud Architecture'],
        contactPhone: '+91 98765 43210',
        payoutDetails: { upiId: 'aarav@okaxis', accountHolderName: 'Aarav Sharma', accountNumber: '919876543210', ifscCode: 'UTIB0000123', isVerified: true },
        contactWhatsapp: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        rating: 4.9,
    },
    {
        email: 'priya.lens@mycircle.community',
        displayName: 'Priya Patel',
        firstName: 'Priya',
        lastName: 'Patel',
        bio: 'Portrait and commercial photographer. Love capturing real moments and visual design.',
        location: 'Civil Lines, Bilaspur',
        skills: ['Photography', 'Lightroom', 'Video Production', 'Drone Videography'],
        contactPhone: '+91 98234 56789',
        payoutDetails: { upiId: 'priya@okhdfcbank', accountHolderName: 'Priya Patel', accountNumber: '919823456789', ifscCode: 'HDFC0001234', isVerified: true },
        contactWhatsapp: '+91 98234 56789',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
        rating: 4.8,
    },
    {
        email: 'rahul.gamer@mycircle.community',
        displayName: 'Rahul Verma',
        firstName: 'Rahul',
        lastName: 'Verma',
        bio: 'Tech enthusiast, retro game collector, and PC hardware builder.',
        location: 'Rajendra Nagar, Bilaspur',
        skills: ['PC Building', 'Hardware Repair', 'Gaming'],
        contactPhone: '+91 97123 45678',
        payoutDetails: { upiId: 'rahul@paytm', accountHolderName: 'Rahul Verma', accountNumber: '919712345678', ifscCode: 'PYTM0123456', isVerified: true },
        contactWhatsapp: '+91 97123 45678',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        rating: 4.7,
    },
    {
        email: 'sneha.homes@mycircle.community',
        displayName: 'Sneha Rao',
        firstName: 'Sneha',
        lastName: 'Rao',
        bio: 'Architect & interior designer. Passionate about community spaces and sustainable living.',
        location: 'Nehru Nagar, Bilaspur',
        skills: ['Interior Design', 'AutoCAD', 'Home Staging'],
        contactPhone: '+91 96321 09876',
        contactWhatsapp: '+91 96321 09876',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
        rating: 4.9,
    },
    {
        email: 'amit.educator@mycircle.community',
        displayName: 'Dr. Amit Joshi',
        firstName: 'Amit',
        lastName: 'Joshi',
        bio: 'Mathematics educator with 8+ years teaching experience. CBSE & ICSE specialist.',
        location: 'Mopka, Bilaspur',
        skills: ['Mathematics', 'Physics', 'STEM Coaching'],
        contactPhone: '+91 95432 10987',
        contactWhatsapp: '+91 95432 10987',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        rating: 5.0,
    },
];

const postTemplates = [
    {
        ownerKey: 'aarav.dev@mycircle.community',
        type: 'sell',
        itemCategory: 'electronics',
        title: 'MacBook Air M2 (16GB RAM, 512GB SSD) - Space Grey',
        description: 'Sparingly used MacBook Air M2 in pristine condition. Battery health 98% with only 42 cycle count. Comes with original 35W dual charger, braided USB-C cable, and box. Under AppleCare warranty.',
        price: 92000,
        exchangePreference: 'money',
        location: 'Vyapar Vihar, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'aarav.dev@mycircle.community',
        type: 'service',
        itemCategory: '',
        title: 'Custom Modern Web Application Development (React & Node.js)',
        description: 'Need a fast, responsive website or web dashboard? I build production-ready full stack apps using React 19, Tailwind CSS, Node.js, and MongoDB with clean architecture and SEO optimization.',
        price: 18000,
        exchangePreference: 'money',
        location: 'Bilaspur (Available for remote or local meetups)',
        images: [
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'priya.lens@mycircle.community',
        type: 'service',
        itemCategory: '',
        title: 'Professional Portrait & Product Photography Sessions',
        description: 'Offering high-resolution portrait, portfolio, and product photography. Packages include 2-hour shoot, professional studio lighting setup, and 15 color-graded edited digital negatives.',
        price: 6500,
        exchangePreference: 'money',
        location: 'Civil Lines, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'priya.lens@mycircle.community',
        type: 'rent',
        itemCategory: 'other',
        title: 'Sony A7 IV + 24-70mm f/2.8 GM Lens (Weekend Rental)',
        description: 'Renting out my backup Sony A7 IV full-frame mirrorless body with Sony 24-70mm f/2.8 GM lens. Includes 2 Sony NP-FZ100 batteries, dual charger, and 128GB V90 SD card. Security deposit and valid ID proof required.',
        price: 2800,
        exchangePreference: 'money',
        location: 'Civil Lines, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'rahul.gamer@mycircle.community',
        type: 'barter',
        itemCategory: 'electronics',
        title: 'PlayStation 5 Disc Edition for Xbox Series X',
        description: 'Mint condition PS5 disc version with 2 white DualSense controllers. Looking to swap for an Xbox Series X in comparable condition. Local trade in Bilaspur preferred so we can test both consoles.',
        acceptsBarter: true,
        exchangePreference: 'barter',
        barterPreferences: 'Xbox Series X with controller',
        price: 0,
        location: 'Rajendra Nagar, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'rahul.gamer@mycircle.community',
        type: 'sell',
        itemCategory: 'electronics',
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        description: 'Silver Sony WH-1000XM5 ANC headphones. Industry-leading noise cancellation, 30-hour battery life. Bought 6 months ago, used only indoors for meetings. Includes carrying case and auxiliary cable.',
        price: 21500,
        exchangePreference: 'money',
        location: 'Rajendra Nagar, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'sneha.homes@mycircle.community',
        type: 'rent',
        itemCategory: 'other',
        title: 'Spacious Furnished 2BHK Apartment for Long-term Rent',
        description: 'East-facing 2BHK flat on 4th floor with panoramic city views. Modular kitchen, split AC in master bedroom, high-speed fiber internet, and 24/7 water supply. Family or working professionals preferred.',
        price: 14500,
        exchangePreference: 'money',
        location: 'Nehru Nagar, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1e5250ce0e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'sneha.homes@mycircle.community',
        type: 'sell',
        itemCategory: 'other',
        title: 'Solid Teak Wood 4-Seater Dining Table with Chairs',
        description: 'Handcrafted solid teak wood dining table with glass top and 4 cushioned chairs. Warm honey finish. In excellent shape, selling because we are upgrading to a 6-seater.',
        price: 16000,
        exchangePreference: 'money',
        location: 'Nehru Nagar, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'amit.educator@mycircle.community',
        type: 'service',
        itemCategory: '',
        title: 'Class 9th & 10th Mathematics and Physics Tutoring (In-Person / Online)',
        description: 'Comprehensive concept-building for CBSE/ICSE board exams. Weekly practice tests, doubt-clearing sessions, and individual attention. Free 1-hour trial class available.',
        price: 3500,
        exchangePreference: 'money',
        location: 'Mopka / Civil Lines, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'amit.educator@mycircle.community',
        type: 'request',
        itemCategory: 'electronics',
        title: 'Looking for a Refurbished iPad / Android Tablet for Digital Teaching',
        description: 'Looking to purchase an iPad 9th/10th gen or Samsung Galaxy Tab S6 Lite with stylus support for conducting online math classes. Must be fully functional with good battery backup.',
        budgetMin: 15000,
        budgetMax: 22000,
        exchangePreference: 'money',
        location: 'Mopka, Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'primary',
        type: 'sell',
        itemCategory: 'electronics',
        title: 'Keychron K2 V2 Wireless Mechanical Keyboard (Brown Switches)',
        description: '75% compact wireless mechanical keyboard with hot-swappable Gateron G Pro Brown switches. Mac & Windows compatible, RGB backlighting. Original keycaps, braided cable, and switch puller included.',
        price: 5200,
        exchangePreference: 'money',
        location: 'Bilaspur Central',
        images: [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
        ],
    },
    {
        ownerKey: 'primary',
        type: 'job',
        itemCategory: '',
        title: 'Hiring Freelance UI/UX Designer for Mobile App Redesign',
        description: 'We are redesigning our community platform mobile app and looking for a creative UI/UX designer proficient with Figma and mobile design systems. Project timeline: 3-4 weeks.',
        budgetMin: 20000,
        budgetMax: 35000,
        exchangePreference: 'money',
        isUrgent: true,
        location: 'Remote / Bilaspur',
        images: [
            'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&q=80&w=800',
        ],
    },
];

async function seed() {
    try {
        await connectDB();
        console.log('Connected to database. Starting seed process...');

        // 1. Locate primary user
        let primaryUser = await User.findOne({ email: 'parasmanikhunte@gmail.com' });
        if (!primaryUser) {
            primaryUser = await User.findOne();
        }
        if (!primaryUser) {
            console.log('Creating primary admin user...');
            primaryUser = await User.create({
                email: 'parasmanikhunte@gmail.com',
                displayName: 'PARASMANI KHUNTE',
                firstName: 'Parasmani',
                lastName: 'Khunte',
                role: 'admin',
                location: 'Bilaspur, Chhattisgarh, India',
                bio: 'Full stack developer & community creator.',
                rating: 5.0,
            });
        }
        console.log(`Primary user resolved: ${primaryUser.displayName} (${primaryUser._id})`);

        // 2. Ensure peer users exist
        const userMap = new Map();
        userMap.set('primary', primaryUser);

        for (const peerData of peerSeedData) {
            let user = await User.findOne({ email: peerData.email });
            if (!user) {
                user = await User.create(peerData);
                console.log(`Created peer user: ${user.displayName} (${user.email})`);
            } else {
                user.displayName = peerData.displayName;
                user.location = peerData.location;
                user.bio = peerData.bio;
                user.avatar = peerData.avatar;
                await user.save();
                console.log(`Updated peer user: ${user.displayName}`);
            }
            userMap.set(peerData.email, user);
        }

        // 3. Ensure wallets exist with initial funds
        for (const [, user] of userMap) {
            let wallet = await Wallet.findOne({ user: user._id });
            if (!wallet) {
                wallet = await Wallet.create({
                    user: user._id,
                    balance: user._id.equals(primaryUser._id) ? 15000 : 25000,
                    pendingBalance: 2000,
                    currency: 'INR',
                });
                console.log(`Created wallet for ${user.displayName}: ₹${wallet.balance}`);
            } else if (wallet.balance === 0) {
                wallet.balance = user._id.equals(primaryUser._id) ? 15000 : 25000;
                await wallet.save();
                console.log(`Topped up wallet for ${user.displayName}: ₹${wallet.balance}`);
            }
        }

        // 4. Remove previous test posts with same titles to prevent duplicates
        const titles = postTemplates.map((p) => p.title);
        const delRes = await Post.deleteMany({ title: { $in: titles } });
        console.log(`Cleared ${delRes.deletedCount} existing posts with matching titles.`);

        // 5. Insert new posts
        const postsToCreate = postTemplates.map((tmpl) => {
            const owner = userMap.get(tmpl.ownerKey) || primaryUser;
            return {
                user: owner._id,
                type: tmpl.type,
                itemCategory: tmpl.itemCategory || 'other',
                title: tmpl.title,
                description: tmpl.description,
                price: tmpl.price,
                budgetMin: tmpl.budgetMin,
                budgetMax: tmpl.budgetMax,
                location: tmpl.location,
                locationCoords: {
                    type: 'Point',
                    coordinates: getOffsetLocation(),
                },
                images: tmpl.images || [],
                status: 'active',
                isActive: true,
                isUrgent: !!tmpl.isUrgent,
                acceptsBarter: !!tmpl.acceptsBarter,
                exchangePreference: tmpl.exchangePreference || 'money',
                barterPreferences: tmpl.barterPreferences || '',
                likes: [primaryUser._id],
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };
        });

        const createdPosts = await Post.insertMany(postsToCreate);
        console.log(`Successfully seeded ${createdPosts.length} marketplace listings.`);

        // 6. Seed sample notifications for primary user
        await Notification.deleteMany({ recipient: primaryUser._id });
        const priyaUser = userMap.get('priya.lens@mycircle.community');
        const aaravUser = userMap.get('aarav.dev@mycircle.community');

        const notifications = [
            {
                recipient: primaryUser._id,
                sender: priyaUser?._id,
                type: 'approval',
                title: 'Request Approved',
                message: 'Priya Patel approved your connection request for "Professional Photography Sessions".',
                link: `/post/${createdPosts[2]?._id}`,
                read: false,
            },
            {
                recipient: primaryUser._id,
                sender: aaravUser?._id,
                type: 'request',
                title: 'New Connection Request',
                message: 'Aarav Sharma requested to connect regarding your Keychron K2 keyboard listing.',
                link: `/post/${createdPosts[10]?._id}`,
                read: false,
            },
            {
                recipient: primaryUser._id,
                type: 'system',
                title: 'Welcome to MyCircle!',
                message: 'Your account is ready. Discover trusted local peers, buy & sell with secure escrow, and connect directly.',
                link: '/',
                read: true,
            },
        ];
        await Notification.insertMany(notifications);
        console.log(`Seeded ${notifications.length} notifications for ${primaryUser.displayName}.`);

        // 7. Seed sample contact request
        await ContactRequest.deleteMany({
            $or: [
                { requester: primaryUser._id },
                { recipient: primaryUser._id },
            ],
        });

        if (createdPosts.length >= 3 && priyaUser && aaravUser) {
            const requests = [
                {
                    post: createdPosts[2]._id, // Photography
                    requester: primaryUser._id,
                    recipient: priyaUser._id,
                    status: 'accepted',
                    message: 'Hi Priya, I would love to book a 2-hour portrait session this Saturday!',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                {
                    post: createdPosts[10]._id, // Keyboard
                    requester: aaravUser._id,
                    recipient: primaryUser._id,
                    status: 'pending',
                    message: 'Hey Paras, is the Keychron keyboard still available? Can we meet near City Mall?',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            ];
            await ContactRequest.insertMany(requests);
            console.log(`Seeded ${requests.length} sample contact requests.`);
        }

        console.log('✅ All seed data generated and populated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seed execution error:', err);
        process.exit(1);
    }
}

seed();
