const User = require("../models/user");
require("dotenv");

const { StatusCodes } = require("http-status-codes");
const {
  CustomAPIError,
  UnauthenticatedError,
  NotFoundError,
  BadRequestError,
} = require("../errors");
//Note: since the index.js file if the default file in utils folder, there is no need specifying the file
const { attachCookiesToResponse } = require("../utils");

const register = async (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;

  if (!name || (!email && !phoneNumber) || !password) {
    return next(new BadRequestError("All fields are required"));
  }

  if (password.length < 4) {
    return next(new BadRequestError("Password must be up to 4 characters"));
  }

  const isPhone = /^\d+$/.test(email);

  if (isPhone) {
    req.body.phoneNumber = email;
    delete req.body.email;
  }

  // Check if user already exists based on email or phone number
  const phoneOrEmail = isPhone
    ? { phoneNumber: req.body.phoneNumber }
    : { email };

  const existingUser = await User.findOne(phoneOrEmail);
  if (existingUser) {
    return next(new BadRequestError("User already exists"));
  }

  try {
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const newUser = await User.create({
      name,
      password,
      role,
      ...(isPhone ? { phoneNumber: req.body.phoneNumber } : { email }),
    });

    //This is done to avoid access to. sensitive informations such as the password
    const tokenUser = {
      name: newUser.name,
      id: newUser._id,
      role: newUser.role,
      ...(isPhone ? { phoneNumber: req.body.phoneNumber } : { email }),
    };
    attachCookiesToResponse({ res, user: tokenUser });
    return res.status(StatusCodes.CREATED).json({ newUser: tokenUser });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new BadRequestError(
        "Please provide your email or phone number and password"
      )
    );
  }

  const isPhone = /^\d+$/.test(email);
  const phoneOrEmail = isPhone ? { phoneNumber: email } : { email };

  const existingUser = await User.findOne(phoneOrEmail);
  if (!existingUser) {
    return next(new BadRequestError("Invalid email or phone number"));
  }

  const correctPassword = await existingUser.comparePassword(password);
  if (!correctPassword) {
    return next(new UnauthenticatedError("Incorrect password"));
  }

  const tokenUser = {
    name: existingUser.name,
    role: existingUser.role,
    id: existingUser._id,
  };
  const token = attachCookiesToResponse({ res, user: tokenUser });
  console.log(token);
  // Send both the user data and token in the response body
  return res.status(StatusCodes.OK).json({ newUser: tokenUser, token });
};

const logout = async (req, res) => {
  //removing the cookies to logout
  res.cookie("mytoken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = {
  register,
  login,
  logout,
};
