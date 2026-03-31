const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedDemo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");

    const existing = await User.findOne({ email: "demo@example.com" });
    if (existing) {
      console.log("Demo user already exists, skipping seed.");
    } else {
      await User.create({
        name: "Demo User",
        email: "demo@example.com",
        password: "demo1234",
        role: "admin",
      });
      console.log("Demo user created: demo@example.com / demo1234");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedDemo();
