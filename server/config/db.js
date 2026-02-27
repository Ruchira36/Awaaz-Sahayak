const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_agent';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.warn('MongoDB not available:', error.message);
    console.warn('Server will run without database (data will not persist).');
  }
};

module.exports = connectDB;
