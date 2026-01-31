const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load env vars explicitly
dotenv.config({ path: './.env' });

console.log('Environment loaded.');
console.log('MONGO_URI Present:', !!process.env.MONGO_URI);

const users = [
    {
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        googleId: 'seed_12345',
        bio: 'Expert Plumber with 10 years of experience in residential and commercial plumbing.',
        location: 'New York, USA',
        skills: ['Plumber', 'Pipe Fitting', 'Maintenance'],
        rating: 4.8,
        reviews: 15,
        skillEndorsements: [
            { skill: 'Plumber', count: 42, endorsedBy: [] },
            { skill: 'Pipe Fitting', count: 12, endorsedBy: [] }
        ]
    },
    {
        displayName: 'Alice Smith',
        email: 'alice.smith@example.com',
        googleId: 'seed_67890',
        bio: 'Professional Electrician specialized in smart home installations.',
        location: 'San Francisco, USA',
        skills: ['Electrician', 'Smart Home', 'Wiring'],
        rating: 4.9,
        reviews: 28,
        skillEndorsements: [
            { skill: 'Electrician', count: 55, endorsedBy: [] },
            { skill: 'Smart Home', count: 30, endorsedBy: [] }
        ]
    },
    {
        displayName: 'Michael Johnson',
        email: 'michael.j@example.com',
        googleId: 'seed_11223',
        bio: 'Full Stack Developer. I build web and mobile apps.',
        location: 'Austin, USA',
        skills: ['Developer', 'React', 'Node.js'],
        rating: 4.7,
        reviews: 40,
        skillEndorsements: [
            { skill: 'Developer', count: 25, endorsedBy: [] },
            { skill: 'React', count: 60, endorsedBy: [] }
        ]
    },
    {
        displayName: 'Sarah Wilson',
        email: 'sarah.w@example.com',
        googleId: 'seed_44556',
        bio: 'Graphic Designer creating stunning visuals and branding identity.',
        location: 'London, UK',
        skills: ['Designer', 'Branding', 'UI/UX'],
        rating: 4.6,
        reviews: 22,
        skillEndorsements: [
            { skill: 'Designer', count: 18, endorsedBy: [] },
            { skill: 'Branding', count: 5, endorsedBy: [] }
        ]
    },
    {
        displayName: 'Robert Brown',
        email: 'robert.b@example.com',
        googleId: 'seed_77889',
        bio: 'Certified Mechanic for all car makes and models.',
        location: 'Chicago, USA',
        skills: ['Mechanic', 'Car Repair', 'Diagnostics'],
        rating: 4.5,
        reviews: 10,
        skillEndorsements: [
            { skill: 'Mechanic', count: 8, endorsedBy: [] }
        ]
    },
    {
        displayName: 'Emily Davis',
        email: 'emily.d@example.com',
        googleId: 'seed_99001',
        bio: 'Math and Physics Tutor for high school and college students.',
        location: 'Online',
        skills: ['Tutor', 'Math', 'Physics'],
        rating: 5.0,
        reviews: 5,
        skillEndorsements: [
            { skill: 'Tutor', count: 15, endorsedBy: [] }
        ]
    }
];

const seedDB = async () => {
    try {
        // Use Dev DB if local, or Production if specified
        // Logic similar to src/config/db.js to ensure consistency
        const dbURI = process.env.MONGO_URI_DEV || process.env.MONGO_URI;

        if (!dbURI) {
            console.error('No MongoDB URI found in .env');
            process.exit(1);
        }

        console.log(`Connecting to database at: ${dbURI}`);
        await mongoose.connect(dbURI);
        console.log('MongoDB Connected');

        // Process each user
        for (const userData of users) {
            // Upsert functionality
            let user = await User.findOne({ email: userData.email });

            if (user) {
                console.log(`Updating user: ${userData.displayName}`);
                user.bio = userData.bio;
                user.skills = userData.skills;
                user.location = userData.location;
                user.rating = userData.rating;
                user.reviews = userData.reviews;
                user.skillEndorsements = userData.skillEndorsements;
            } else {
                console.log(`Creating user: ${userData.displayName}`);
                user = new User(userData);
            }
            await user.save();
        }

        console.log('Seeding Completed Succesfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDB();
