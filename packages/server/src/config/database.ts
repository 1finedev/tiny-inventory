import mongoose from "mongoose";

const MONGODB_URI =
  Bun.env.MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/tiny-inventory";
export async function connectDatabase() {

  await mongoose.connect(MONGODB_URI);
  console.log("=> MongoDB connected");
}
