const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "please provide rating number"],
      minlength: 1,
      maxlength: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, "title can't be more than 200 chracters"],
    },
    comment: {
      type: String,
      required: [true, "please provide review comment"],
      maxlength: [500, "comment can't be more than 500 characters"],
    },
    image: {
      type: String,
      required: [true, "upload product image"],
      default: "/uploads/exp.jpeg",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating",
        },
        numberOfReviews: {
          $sum: 1,
        },
      },
    },
  ]);

  const ratingCounts = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingRange = {
    oneStar: 0,
    twoStar: 0,
    threeStar: 0,
    fourStar: 0,
    fiveStar: 0,
  };

  // Map the numeric rating to the corresponding descriptive key
  ratingCounts.forEach((rating) => {
    if (rating._id === 1) ratingRange.oneStar = rating.count;
    if (rating._id === 2) ratingRange.twoStar = rating.count;
    if (rating._id === 3) ratingRange.threeStar = rating.count;
    if (rating._id === 4) ratingRange.fourStar = rating.count;
    if (rating._id === 5) ratingRange.fiveStar = rating.count;
  });

  try {
    await this.model("Product").findOneAndUpdate(
      { _id: productId },
      {
        averageRating: parseFloat((result[0]?.averageRating || 0).toFixed(2)),
        numberOfReviews: result[0]?.numberOfReviews || 0,
        ratingRange,
      }
    );
  } catch (error) {
    console.log(error);
  }
};
ReviewSchema.post("save", async function () {
  await this.model("Review").calculateAverageRating(this.product);
});
// ReviewSchema.post("remove", async function () {
//   await this.model("Review").calculateAverageRating(this.product);
// });
const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
