import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
mongoose.connect(
    process.env.DB_CODE
);
var db = mongoose.connection;
db.on("error", () => console.log("Error in connection to Database"));
db.once("open", () => console.log("Connected to Database Successfully"));
export default db;