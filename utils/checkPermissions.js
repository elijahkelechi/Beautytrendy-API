const { StatusCodes } = require("http-status-codes");
const { UnauthorizedError } = require("../errors");
const checkPermissions = (requestUser, resourceUserId) => {
  //
  //   console.log(typeof requestUser);
  //   console.log(typeof resourceUser);

  if (requestUser.role === "admin") return;
  if (requestUser.id === resourceUserId.toString()) return;
  throw new UnauthorizedError("you cant access this route");
};
module.exports = {
  checkPermissions,
};
