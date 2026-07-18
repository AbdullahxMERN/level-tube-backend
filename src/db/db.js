import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
const conenctDB = async () => {
  try {
    const database = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
    );
    console.log("mongoDB is conected ");
  } catch (error) {
    console.log("database failed :", error);
  }
};

export default conenctDB;
