const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDB(uri, dbName) {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const safeUri = uri.replace(/:([^:@]+)@/, ":****@");
    console.log("🔗 Connecting with URI:", safeUri);

    connectionPromise = mongoose.connect(uri, {
      dbName: dbName || "meetx",
    });

    connectionPromise
      .then(() => {
        console.log("✅ MongoDB successfully connected!");
      })
      .catch((error) => {
        connectionPromise = null;
        console.error("❌ MONGODB CONNECTION ERROR:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
      });
  }

  return connectionPromise;
}

async function ensureDBConnection(req, res, next) {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB(process.env.MONGODB_URI, process.env.DB_NAME);
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { connectDB, ensureDBConnection };
