const {
  CustomAPIError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} = require("../errors");
const { isTokenValid } = require("../utils");

const authenticateUser = (req, res, next) => {
  const token = req.signedCookies.mytoken;

  if (!token) {
    return next(new UnauthenticatedError("invalid authentication"));
  }

  try {
    // const payload = isTokenValid({ token });
    //   console.log(payload);
    const { name, id, role } = isTokenValid({ token });
    req.user = { name, id, role };
    next();
  } catch (error) {
    return next(new UnauthenticatedError("invalid token"));
  }
};

const authorizedPermission = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new UnauthorizedError("your not allowed to access this route"));
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizedPermission,
};
