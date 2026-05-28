require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetx';
  
  try {
    console.log(`Testing MongoDB connection to: ${uri}...`);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Successfully connected to MongoDB!');

    // Check if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`⚠️ Database already has ${userCount} users. Skipping seed.`);
      process.exit(0);
    }

    console.log('Seeding mock users...');
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const mockUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        isOtpVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        passwordHash,
        isOtpVerified: true
      },
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        passwordHash,
        isOtpVerified: false
      }
    ];

    await User.insertMany(mockUsers);
    
    console.log('✅ Successfully seeded 3 mock users!');
    console.log('You can login with john@example.com / password123');
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB. Is your local MongoDB server running?');
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
