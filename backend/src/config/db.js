const mongoose = require("mongoose");

async function connectDB(uri, dbName) {
  try {
    console.log("🚀 Attempting to connect to MongoDB...");

    // Safely log the URI by masking the password so you don't leak it in Vercel logs
    const safeUri = uri ? uri.replace(/:([^:@]+)@/, ":****@") : "UNDEFINED URI";
    console.log("🔗 Connecting with URI:", safeUri);

    if (!uri) {
      console.error(
        "❌ FATAL: MONGODB_URI is totally missing from environment variables!",
      );
      throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // dbName: "meetx",
      dbName: dbName || "meetx",
    });
    console.log("✅ MongoDB successfully connected!");
  } catch (error) {
    console.error("❌ MONGODB CONNECTION ERROR:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    throw error;
  }
}

module.exports = { connectDB };
