import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      default: "My Schedule"
    },

    availability: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    preferences: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    scheduleContent: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;