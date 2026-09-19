import dotenv from "dotenv";
dotenv.config({ path: ".config.env" });

import mongoose from "mongoose";

import { httpServer } from "./app.js";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`mongodb connected`);
  } catch (error) {
    console.log(`mongodb connection error:${error.message}`);
    process.exit(1);
  }
};
connectDB();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
