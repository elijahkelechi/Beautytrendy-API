const jwt = require("jsonwebtoken");

const createToken = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user }) => {
  const token = createToken({ payload: user });
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie("mytoken", token, {
    httpOnly: false, // More secure; set to false only if you need access in frontend JS
    sameSite: "None", // Correct format for SameSite attribute
    expires: new Date(Date.now() + oneDay), // Sets expiry date
    maxAge: oneDay, // Easier to manage cookie expiry in milliseconds
    secure: process.env.NODE_ENV === "production", // Set to true in production for HTTPS
    signed: true, // Cookie is signed
  });

  return token;
};

module.exports = {
  createToken,
  isTokenValid,
  attachCookiesToResponse,
};
