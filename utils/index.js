const {
  createToken,
  isTokenValid,
  attachCookiesToResponse,
} = require("./jwtToken");
const { checkPermissions } = require("./checkPermissions");
module.exports = {
  createToken,
  isTokenValid,
  attachCookiesToResponse,
  checkPermissions,
};
