import mongoose from "mongoose";
const DonateSchema = new mongoose.Schema({
    id: {
      type: String,
      unique: true,
    },
    ftype: {
      type: String,
      required: true,
    },
    quality: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    organisation: {
      type: String,
      required: true,
    },
    expiry: {
      type: BigInt,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
});
const Fooddb = new mongoose.model("food", DonateSchema);
export default Fooddb;