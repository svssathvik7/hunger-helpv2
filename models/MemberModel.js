import mongoose from "mongoose";
const MemberSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    orgname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true
    },
    isAdmin:{
      type: Boolean,
      required: true,
    },
});
const Memberdb = new mongoose.model("members", MemberSchema);
export default Memberdb;