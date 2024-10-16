const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizedPermission,
} = require("../middleware/authentication");

const {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  uploadReviewImage,
} = require("../controllers/reviewController");

router.route("/").post(authenticateUser, createReview).get(getAllReviews);

router.post("/uploadReviewImage", authenticateUser, uploadReviewImage);

router
  .route("/:id")
  .get(getSingleReview)
  .patch(authenticateUser, updateReview)
  .delete(authenticateUser, deleteReview);

module.exports = router;
