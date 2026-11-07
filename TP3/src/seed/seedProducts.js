import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { sampleProducts } from './sampleProducts.js';
import { connectDB } from '../config/db.js';
import { assertRuntimeConfig, env } from '../config/env.js';

async function seedProducts() {
  assertRuntimeConfig();
  await connectDB(env.mongodbUri);

  const operations = sampleProducts.map((product) => ({
    updateOne: {
      filter: { name: product.name },
      update: { $set: product },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(operations);
  const total = await Product.countDocuments();

  console.log(
    `[seed] Upserted ${sampleProducts.length} sample products ` +
      `(${result.upsertedCount} new). Total documents in collection: ${total}.`
  );

  await mongoose.connection.close();
}

seedProducts().catch(async (error) => {
  console.error(`[seed] Failed: ${error.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
