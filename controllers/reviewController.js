const { StatusCodes, CREATED } = require("http-status-codes");
const Review = require("../models/review");
const { checkPermissions } = require("../utils/checkPermissions");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const {
  CustomAPIError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} = require("../errors");
const Product = require("../models/product");
const createReview = async (req, res, next) => {
  try {
    const { product: productId } = req.body;

    const validProduct = await Product.findById(productId);
    if (!validProduct) {
      throw new NotFoundError(
        `The product does not exists with the id:${productId}`
      );
    }
    const alreadySubmitted = await Review.findOne({
      product: productId,
      user: req.user.id,
    });
    if (alreadySubmitted) {
      throw new BadRequestError(
        "You already submitted a review on this product"
      );
    }
    req.body.user = req.user.id;
    console.log(req.user.id);
    const review = await Review.create(req.body);
    res.status(StatusCodes.CREATED).json({ review });
  } catch (error) {
    next(error);
  }
};
const getAllReviews = async (req, res) => {
  const reviews = await Review.find({})
    .populate({
      path: "product",
      select: "name brand fragrances category",
    })
    .populate({
      path: "user",
      select: "name",
    });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};
const getSingleReview = async (req, res, next) => {
  try {
    const { id: reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new BadRequestError(`No review with the id:${reviewId}`);
    }
    res.status(StatusCodes.OK).json({ review });
  } catch (error) {
    next(error);
  }
};
const updateReview = async (req, res, next) => {
  try {
    const { id: reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const review = await Review.findById(reviewId);
    // const productId = review.product;
    // const product = await Product.find(productId);
    // const iNeed = {
    //   name: product[0].name,
    //   price: product[0].price,
    // };
    if (!review) {
      throw new NotFoundError(`No review with the id: ${reviewId}`);
    }
    checkPermissions(req.user, review.user);
    (review.rating = rating),
      (review.title = title),
      (review.comment = comment);
    await review.save();
    res.status(StatusCodes.OK).json({ review, msg: "Success! review updated" });
  } catch (error) {
    next(error);
  }
};
const deleteReview = async (req, res, next) => {
  try {
    const { id: reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError(`No review with the id:${reviewId}`);
    }
    checkPermissions(req.user, review.user);
    await Review.findByIdAndDelete(reviewId);
    await Review.calculateAverageRating(review.product);
    res.status(StatusCodes.OK).json({ msg: "Success! review deleted" });
  } catch (error) {
    next(error);
  }
};

const getSingleProductReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    if (!productId) {
      throw new NotFoundError(`No product with the id:${productId}`);
    }
    const review = await Review.find({ product: productId });
    res.status(StatusCodes.OK).json({ review, count: review.length });
  } catch (error) {
    next(error);
  }
};
const uploadReviewImage = async (req, res, next) => {
  // console.log(req.files);
  try {
    if (!req.files) {
      throw new BadRequestError("No file found");
    }
    const reviewImage = req.files.image;
    if (!reviewImage.mimetype.startsWith("image")) {
      throw new BadRequestError("no image provided");
    }
    const maxSize = 2048 * 2048;
    if (reviewImage.size > maxSize) {
      throw new BadRequestError("please upload image below 2MB");
    }
    // const imagePath = path.join(
    //   __dirname,
    //   "../public/uploads/" + productImage.name
    // );
    // await productImage.mv(imagePath);
    const cloudImage = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: "Review images",
      }
    );
    console.log(cloudImage);
    fs.unlinkSync(req.files.image.tempFilePath);
    res.status(StatusCodes.OK).json({
      image: cloudImage.secure_url,
      cloudImagePublicId: cloudImage.public_id,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReview,
  uploadReviewImage,
};
