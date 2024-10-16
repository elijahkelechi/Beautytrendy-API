const mongoose = require("mongoose");
const validator = require("validator");
const bycrypt = require("bcryptjs");
const { boolean } = require("joi");
const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "please provide name"],
    minlength: 3,
    maxlength: 35,
  },

  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        return !this.phoneNumber && validator.isEmail(v); // Validates only if phoneNumber is not provided
      },
      message: "please provide a valid email",
    },
    required: function () {
      return !this.phoneNumber; // Email is required only if phoneNumber is not provided
    },
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return !this.email && validator.isMobilePhone(v); // Validates only if email is not provided
      },
      message: "please provide a valid phone number",
    },
    required: function () {
      return !this.email; // Phone number is required only if email is not provided
    },
  },

  password: {
    type: String,
    required: [true, "please enter password"],
    minlength: 4,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  confirmationToken: {
    type: String,
  },
  confirmationTokenExpires: {
    type: Date,
  },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre("save", async function () {
  const salt = await bycrypt.genSalt(10);
  this.password = await bycrypt.hash(this.password, salt);
});
// to be able to compare the hashed password so the user can login again
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bycrypt.compare(candidatePassword, this.password);
  return isMatch;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
