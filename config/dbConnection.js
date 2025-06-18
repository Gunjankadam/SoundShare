const mongoose = require('mongoose');
require('dotenv').config(); 
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.log('MongoDB URI:', process.env.CONNECTION_STRING);
    console.error('MongoDB connection error:', error);
    

  }
};

module.exports = connectDb;
