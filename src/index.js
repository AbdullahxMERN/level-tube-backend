import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { app } from "./app.js";
import conenctDB from "./db/db.js";

conenctDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("app is runing", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("error in concection of DB", err);
  });
