const { StatusCodes } = require("http-status-codes");
const notFound = (req, res) =>
  res.status(StatusCodes.OK).send("Route does not exist");

module.exports = notFound;
