// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb-mongoose
import { ObjectId } from "bson";
import mongoose from "mongoose";

var { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
  // @ts-ignore
  global.ObjectId = ObjectId;
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-shadow
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

function dbConnectNow() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-shadow
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = cached.promise;
  return cached.conn;
}

export default dbConnect;
export { dbConnectNow };
