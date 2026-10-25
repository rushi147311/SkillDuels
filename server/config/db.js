const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch {
    console.error("Database connection failed. Check MONGO_URI and database availability.");
    process.exit(1);
  }
};

module.exports = connectDB;
