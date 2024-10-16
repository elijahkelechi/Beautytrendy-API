const mongoose = require("mongoose");
const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const {
  CustomAPIError,
  UnauthenticatedError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../errors");
const { attachCookiesToResponse, checkPermissions } = require("../utils");

const getAllUsers = async (req, res) => {
  console.log(req.user);
  const users = await User.find({ role: "user" }, "name email role");
  res.status(StatusCodes.OK).json({ users });
};
const getSingleUser = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new BadRequestError("Invalid ID format check"));
  }
  try {
    const singleUser = await User.findById(id).select("-password");

    if (!singleUser) {
      return next(new BadRequestError(`No user with such Id: ${id}`));
    }
    checkPermissions(req.user, singleUser._id);
    return res.status(StatusCodes.OK).json({ singleUser });
  } catch (error) {
    next(error);
  }
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};
const updateUser = async (req, res, next) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return next(new BadRequestError("please provide name and email"));
  }
  const user = await User.findOneAndUpdate(
    { _id: req.user.id },
    { email, name },
    {
      new: true,
      runValidators: true,
    }
  );

  const tokenUser = {
    name: user.name,
    id: user._id,
    role: user.role,
    ...(req.body.phoneNumber
      ? { phoneNumber: req.body.phoneNumber }
      : { email }),
  };
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};
const updateUserPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      next(new BadRequestError("all fields is required"));
    }
    const user = await User.findById(req.user.id);
    const correctPassword = await user.comparePassword(oldPassword);
    if (!correctPassword) {
      next(new UnauthenticatedError("password does not match"));
    }
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).send("password changed successfuly");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
