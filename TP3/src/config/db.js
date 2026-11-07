import mongoose from 'mongoose';

/**
 * Connects the application to MongoDB using Mongoose.
 * Works with both a local MongoDB server and MongoDB Atlas.
 */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  const { host, name } = mongoose.connection;
  console.log(`[db] Connected to MongoDB (${host}/${name})`);
}
