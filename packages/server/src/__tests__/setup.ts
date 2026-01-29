import mongoose from "mongoose";
import { connectDatabase } from "@/config/database";
import "@/models";

let isConnected = false;

export async function setupTestDatabase() {
  if (isConnected) return;
  
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tiny-inventory-test";
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

export async function teardownTestDatabase() {
  if (!isConnected) return;
  
  await mongoose.connection.db.dropDatabase();
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
