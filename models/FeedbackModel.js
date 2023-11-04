import mongoose from "mongoose"
const FeedbackSchema = new mongoose.Schema({
    email : {
      required : true,
      type : String,
    },
    username : {
      required : true,
      type : String,
    },
    feedback : {
      required : true,
      type : String,
    }
})
module.exports = new mongoose.model("feedback",FeedbackSchema);