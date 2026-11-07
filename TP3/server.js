import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { assertRuntimeConfig, env } from './src/config/env.js';

async function start() {
  assertRuntimeConfig();
  await connectDB(env.mongodbUri);

  const server = app.listen(env.port, () => {
    console.log(
      `[server] TechNest Store API listening on http://localhost:${env.port} (${env.nodeEnv})`
    );
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error(`[server] Failed to start: ${error.message}`);
  process.exit(1);
});
