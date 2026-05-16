import mongoose from "mongoose";

const userSchema = mongoose.Schema({

  username: {
    type: String,
    required: [true, "Please enter a valid Username"],
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 6
  }

}, {
    timestamps: true
});

const userModel = mongoose.model("User", userSchema)

export default userModel;