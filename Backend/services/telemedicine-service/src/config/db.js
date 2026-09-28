const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Telemedicine Service MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Telemedicine Service DB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;