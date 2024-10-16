const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
} = require("../controllers/userController");
const {
  authenticateUser,
  authorizedPermission,
} = require("../middleware/authentication");

router.get(
  "/",
  authenticateUser,
  authorizedPermission("admin", "contributor"),
  getAllUsers
);
router.get("/current", authenticateUser, showCurrentUser);
router.patch("/updateUser", authenticateUser, updateUser);
router.patch("/updateUserPassword", authenticateUser, updateUserPassword);
router.get("/:id", authenticateUser, getSingleUser);

module.exports = router;
