import mongoose from "mongoose";
const BiogasSchema = new mongoose.Schema({
    quantity: {
      type: Number,
      required: true,
    },
    organisation: {
      type: String,
      required: true,
    },
});
const Biogasdb = new mongoose.model("biogas", BiogasSchema);
export default Biogasdb;