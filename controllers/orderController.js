const Order = require("../models/order");
const Product = require("../models/product");
const { checkPermissions } = require("../utils/checkPermissions");
const { StatusCodes } = require("http-status-codes");
const {
  CustomAPIError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} = require("../errors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getClientSecret = async (req, res, next) => {
  try {
    const { total } = req.body;
    if (!total) {
      throw new BadRequestError("The total amount shoud be greater than zero");
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "USD",
    });
    res
      .status(StatusCodes.OK)
      .json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const {
      items: cartItems,
      tax,
      shippingFee,
      formName,
      formAddress,
      formCity,
      formState,
      formCountry,
      clientSecret,
    } = req.body;
    if (!cartItems || cartItems.length < 1) {
      throw new BadRequestError("details required in cart Items");
    }
    if (tax === null || shippingFee == null) {
      throw new BadRequestError("please enter your tax and shipping fee");
    }
    let orderItems = [];
    let subtotal = 0;
    for (const item of cartItems) {
      const dbproduct = await Product.findById(item.product);
      if (!dbproduct) {
        throw new NotFoundError("Please create order on valid products");
      }
      const { name, price, image, _id } = dbproduct;
      const singleOrderItem = {
        name,
        image,
        price,
        amount: item.amount,
        product: _id,
      };
      //add items to order
      orderItems = [...orderItems, singleOrderItem];
      subtotal += item.amount * price;
    }
    const total = tax + shippingFee + subtotal;

    const order = await Order.create({
      orderItems,
      tax,
      shippingFee,
      formName,
      formAddress,
      formCity,
      formState,
      formCountry,
      subtotal,
      total,
      clientSecret,
      user: req.user.id,
    });

    res.status(StatusCodes.CREATED).json({ order, clientSecret: clientSecret });
  } catch (error) {
    next(error);
  }
};
const getAllOrders = async (req, res) => {
  const orders = await Order.find({}).populate({
    path: "user",
    select: "name",
  });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError(`No order with the id: ${orderId}`);
    }
    checkPermissions(req.user, order.user);
    res.status(StatusCodes.OK).json({ order });
  } catch (error) {
    next(error);
  }
};
const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const updateOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    const { paymentIntentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError(`No rNo order with the id: ${orderId}`);
    }
    checkPermissions(req.user, order.user);

    if (!paymentIntentId) {
      throw new BadRequestError("Payment Intent ID is required.");
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if the payment was successful before updating the order status
    if (paymentIntent.status !== "succeeded") {
      throw new BadRequestError("Payment was not successful.");
    }

    order.paymentIntentId = paymentIntentId;
    order.status = "paid";
    await order.save();
    res.status(StatusCodes.OK).json({ order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClientSecret,
  createOrder,
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  updateOrder,
};
