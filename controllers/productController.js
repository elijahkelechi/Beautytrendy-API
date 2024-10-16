const mongoose = require("mongoose");
const Product = require("../models/product");
const Review = require("../models/review");
const { StatusCodes } = require("http-status-codes");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const {
  CustomAPIError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} = require("../errors");

const createProduct = async (req, res, next) => {
  try {
    req.body.userCreatingTheProduct = req.user.id;
    // if (!req.files) {
    //   throw new BadRequestError("no image file found");
    // }
    // const productImage = req.files.image;
    // console.log(productImage);
    // if (!productImage.mimetype.startsWith("image")) {
    //   throw new BadRequestError("Please upload an image file");
    // }
    // const cloudImage = await cloudinary.uploader.upload(
    //   req.files.image.tempFilePath,
    //   { use_filename: true, folder: "sonnatrendy product images" }
    // );
    // fs.unlinkSync(req.files.image.tempFilePath);
    // req.body.image = cloudImage.secure_url;
    // req.body.cloudImagePublicId = cloudImage.public_id;

    const product = await Product.create(req.body);
    res.status(StatusCodes.CREATED).json({ product });
  } catch (error) {
    next(error);
  }
};
const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1, // Default to page 1
      limit = 10, // Default to limit of 10 items per page
      category,
      brand,
      price,
      featured,
      freeShipping,
      sort,
      search, // Add search query
    } = req.query;

    // Build query object for filtering
    const queryObject = {};

    // Apply filters
    if (category) {
      queryObject.category = category;
    }
    if (brand) {
      queryObject.brand = brand;
    }
    if (featured) {
      queryObject.featured = featured === "true"; // Convert to boolean
    }
    if (freeShipping) {
      queryObject.freeShipping = freeShipping === "true"; // Convert to boolean
    }

    // Price range filter (format: price=100-500 for example)
    if (price) {
      const [minPrice, maxPrice] = price.split("-");
      queryObject.price = {
        ...(minPrice && { $gte: Number(minPrice) }), // Greater than or equal to minPrice
        ...(maxPrice && { $lte: Number(maxPrice) }), // Less than or equal to maxPrice
      };
    }

    // Search by product name
    if (search) {
      queryObject.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Convert page and limit to numbers
    const currentPage = Number(page);
    const itemsPerPage = Number(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // Input validation
    if (currentPage < 1 || itemsPerPage < 1) {
      throw new BadRequestError("Invalid page or limit value");
    }

    // Initialize query with the filters applied
    let query = Product.find(queryObject);

    // Sorting logic

    if (sort) {
      const sortList = sort.split(",").join(" ");
      query = query.sort(sortList);
    } else {
      query = query.sort({ createdAt: -1, _id: -1 });
    }

    // Apply pagination
    query = query.skip(skip).limit(itemsPerPage);

    // Execute query
    const products = await query;

    // Count total products (for pagination metadata)
    const totalProducts = await Product.countDocuments(queryObject);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const hasMore = currentPage < totalPages;

    // Send response
    res.status(StatusCodes.OK).json({
      products,
      totalProducts,
      totalPages,
      currentPage,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleProduct = async (req, res, next) => {
  //   console.log(req.params);
  const { id } = req.params;
  try {
    const product = await Product.findById(id).populate("reviews");
    if (!product) {
      throw new NotFoundError(`No product with the id ${id}`);
    }
    res.status(StatusCodes.OK).send({ product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const { id: productId } = req.params;
  const modify = req.body;
  try {
    const product = await Product.findByIdAndUpdate(productId, modify, {
      new: true,
      ruValidators: true,
    });
    if (!product) {
      throw new NotFoundError(`No product with the id ${productId}`);
    }
    res.status(StatusCodes.OK).json({ product });
  } catch (error) {
    next(error);
  }
};

const deleteCloudinaryImage = async (cloudImagePublicId) => {
  try {
    await cloudinary.uploader.destroy(cloudImagePublicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    throw new Error("Failed to delete image");
  }
};
const deleteProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError(`No product with the id:${productId}`);
    }
    if (product.cloudImagePublicId) {
      await deleteCloudinaryImage(product.cloudImagePublicId);
    }
    await Review.deleteMany({ product: productId });

    await Product.deleteOne({ _id: productId });

    res.status(StatusCodes.OK).json({ msg: "product deleted successfully!" });
  } catch (error) {
    next(error);
  }
};
const uploadImage = async (req, res, next) => {
  // console.log(req.files);
  try {
    if (!req.files) {
      throw new BadRequestError("No uploaded file");
    }
    const productImage = req.files.image;
    if (!productImage.mimetype.startsWith("image")) {
      throw new BadRequestError("no image provided");
    }
    const maxSize = 2048 * 2048;
    if (productImage.size > maxSize) {
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
        folder: "beautytrendy",
      }
    );

    fs.unlinkSync(req.files.image.tempFilePath);
    res.status(StatusCodes.OK).json({
      image: cloudImage.secure_url,
      cloudImagePublicId: cloudImage.public_id,
    });
  } catch (error) {
    next(error);
  }
};

const uploadVideo = async (req, res, next) => {
  // console.log(req.files);
  try {
    if (!req.files) {
      throw new BadRequestError("No uploaded file");
    }
    const productVideo = req.files.video;
    if (!productVideo.mimetype.startsWith("video")) {
      throw new BadRequestError("no video provided");
    }
    const maxSize = 500 * 1024 * 1024;
    if (productVideo.size > maxSize) {
      throw new BadRequestError("please upload image below 500MB");
    }
    // const imagePath = path.join(
    //   __dirname,
    //   "../public/uploads/" + productImage.name
    // );
    // await productImage.mv(imagePath);
    const cloudVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        use_filename: true,
        folder: "product videos",
      }
    );

    fs.unlinkSync(req.files.video.tempFilePath);
    res.status(StatusCodes.OK).json({
      video: cloudVideo.secure_url,
      cloudVideoPublicId: cloudVideo.public_id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  uploadVideo,
};
