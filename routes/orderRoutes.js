const express = require("express");
const router = express.Router();
const {
  getClientSecret,
  createOrder,
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  updateOrder,
} = require("../controllers/orderController");
const {
  authenticateUser,
  authorizedPermission,
} = require("../middleware/authentication");

router
  .route("/")
  // .post(authenticateUser, createOrder)
  .post(authenticateUser, createOrder)
  .get(authenticateUser, authorizedPermission("admin"), getAllOrders);

router.get("/currentUserOrders", authenticateUser, getCurrentUserOrders);
router.post("/clientsSecret", authenticateUser, getClientSecret);

router
  .route("/:id")
  .get(authenticateUser, getSingleOrder)
  .patch(authenticateUser, updateOrder);

module.exports = router;
