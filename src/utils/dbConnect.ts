import mongoose from 'mongoose';


const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
let cached = (global as unknown as { mongoose?: MongooseCache }).mongoose;
if (!cached) {
  cached = (global as unknown as { mongoose?: MongooseCache }).mongoose = { conn: null, promise: null };
}

if (!cached) {
  cached = (global as unknown as { mongoose?: MongooseCache }).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: 'mint_explore',
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
