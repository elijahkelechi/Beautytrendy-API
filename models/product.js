const mongoose = require("mongoose");
const validator = require("validator");

const ProductSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "please provide product name"],
      maxlenght: [50, "name cannot be more than 50 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
    },
    description: {
      type: String,
      required: [true, "you haven't entered your product description"],
      maxlength: [500, "description can't be more than 500 characters "],
    },
    image: {
      type: String,
      required: [true, "upload product image"],
      default: "/uploads/exp.jpeg",
    },
    cloudImagePublicId: {
      type: String,
      //   required: [true, "cannot find cloud image id"],
    },
    additionalImages: {
      type: [
        {
          url: {
            type: String,
          },
          cloudImagePublicId: {
            type: String,
            required: false,
          },
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= 3; // Ensure the array contains no more than 4 items
        },
        message: "You can upload a maximum of 3 additional images.",
      },
    },
    video: {
      type: String,
    },

    category: {
      type: String,
      required: [true, "please provide product category"],
      enum: {
        values: [
          "moisturizers",
          "face care",
          "body butters & lotions",
          "cleansers",
          "serums",
        ],
        message: "{VALUE} is not a supported category",
      },
    },
    brand: {
      type: String,
      required: [true, "please provide product brand"],
      enum: {
        values: ["Nivea", "NaturGlow", "GlowEssence", "SheaDelight", "SunCare"],
        message: "{VALUE} is not a supported brand",
      },
    },
    sizes: {
      type: [
        {
          value: {
            type: Number,
            required: function () {
              return this.unit !== undefined;
            }, // Require value if unit is provided
            min: [1, "Size value must be greater than 0"],
          },
          unit: {
            type: String,
            required: function () {
              return this.value !== undefined;
            }, // Required unit if value is provided
            enum: {
              values: ["l", "cl", "ml", "kg", "g", "mg"],
              message: "{VALUE} is not a valid unit",
            },
          },
          price: {
            type: Number,
            required: true, // Require price for each size
            min: [0, "Price must be a positive number"],
          },
        },
      ],
      validate: {
        validator: function (v) {
          return (
            v.length === 0 ||
            v.every((size) => size.value && size.unit && size.price)
          );
          // Ensure that if sizes are provided, value, unit, and price must all be present
        },
        message: "Each size must have a value, unit, and prices.",
      },
    },

    featured: {
      type: Boolean,
      default: false,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    inventory: {
      type: Number,
      required: true,
      default: 15,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    ratingRange: {
      type: Map,
      of: Number,
      default: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
    userCreatingTheProduct: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProductSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  justOne: false,
  //   match: { rating: 1 },
});

// ProductSchema.pre("remove", async function (next) {
//   await this.model("Review").deleteMany({ product: this._id });
// });
const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
