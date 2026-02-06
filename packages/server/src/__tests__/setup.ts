import mongoose from "mongoose";
import "@/models";

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST ??
  Bun.env.MONGODB_URI_TEST ??
  "mongodb://localhost:27017/tiny-inventory-test";

let isConnected = false;

export async function setupTestDatabase() {
  if (isConnected) return;

  await mongoose.connect(TEST_DB_URI);
  isConnected = true;
}

export async function teardownTestDatabase() {
  if (!isConnected) return;
  
  await mongoose.connection.db?.dropDatabase?.();
  await mongoose.connection.close();
  isConnected = false;
}

export async function clearCollections() {
  if (!isConnected) return;
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
