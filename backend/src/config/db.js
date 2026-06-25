const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(uri, dbName) {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const safeUri = uri.replace(/:([^:@]+)@/, ":****@");
    console.log("🔗 Connecting with URI:", safeUri);

    const opts = {
      dbName: dbName || "meetx",
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log("✅ MongoDB successfully connected!");
      return mongooseInstance.connection;
    }).catch((error) => {
      cached.promise = null;
      console.error("❌ MONGODB CONNECTION ERROR:", error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
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
