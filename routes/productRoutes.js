const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizedPermission,
} = require("../middleware/authentication");

const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadImage,
  uploadVideo,
  getSingleProduct,
} = require("../controllers/productController");

const { getSingleProductReview } = require("../controllers/reviewController");

router
  .route("/")
  .post(authenticateUser, authorizedPermission("admin"), createProduct)
  .get(getAllProducts);

router.post(
  "/uploadImage",
  authenticateUser,
  authorizedPermission("admin"),
  uploadImage
);
router.post(
  "/uploadVideo",
  authenticateUser,
  authorizedPermission("admin"),
  uploadVideo
);
router
  .route("/:id")
  .get(getSingleProduct)
  .patch(authenticateUser, authorizedPermission("admin"), updateProduct)
  .delete(authenticateUser, authorizedPermission("admin"), deleteProduct);

router.get("/:id/reviews", getSingleProductReview);

module.exports = router;
