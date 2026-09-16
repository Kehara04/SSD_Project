const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not configured for notification-service");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`Notification Service MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Notification Service DB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
