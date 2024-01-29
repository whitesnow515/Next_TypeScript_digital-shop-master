import { Schema, Types } from "mongoose";

import {
  OrderInterface,
  StockInfoInterface,
  SubOrderInterface,
} from "@app-types/models/order";
import dbConnect from "@lib/mongoose";

const stockInfoSchema = new Schema<StockInfoInterface>({
  // maybe we don't need this, just query stock db
  id: { type: Types.ObjectId, required: true },
  replacement: { type: Boolean, default: false },
  firstAccessed: { type: Date, required: false },
  lastAccessed: { type: Date, required: false },
});
const subOrderSchema = new Schema<SubOrderInterface & {status: any, metadata: any, warrantyStartTimestamp?: Date}>({
  product: { type: Types.ObjectId,
    ref: 'Product'
    , required: true },

  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productQuantity: { type: Number, required: true, default: 1 },
  productOption: { type: String, required: true },
  productOptionId: { type: Types.ObjectId, required: true },
  productShortDescription: { type: String, default: "" },
  stocks: { type: [stockInfoSchema], required: true, default: [] },
  warrantyHours: { type: Number, default: 0 },
  warrantyEnabled: { type: Boolean, default: false },
  status: { type: String, default: "pending" },
  warrantyStartTimestamp: {type: Date, required: false},
  metadata: { type: Schema.Types.Mixed },

  stockLines: { type: Number, default: 1 }, // lines * quantity
});
const orderSchemaDef = {
  status: { type: String, default: "pending" },
  user: { type: Types.ObjectId },
  username: { type: String, default: "Guest" },
  email: { type: String, required: true },
  ip: { type: String, default: "Unknown" },
  // timestamp: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed },
  sellix: { type: Schema.Types.Mixed },

  subOrders: { type: [subOrderSchema], required: true },
  notes: { type: String, default: "" },
  paymentMethod: { type: String, default: "" },
  paid: { type: Boolean, default: false },
  totalPriceStr: { type: String, default: "" },
  totalPrice: { type: Number, default: 0 },
  userBalanceSpent: { type: Number, default: 0 },
  shortId: { type: String, default: "" },
  image: { type: String, default: "" },
  warrantyStartTimestamp: { type: Date },
  fee: { type: Number, default: 0 },
  originalPrice: { type: Number, default: -1 },
};
const orderSchema = new Schema<OrderInterface>({
  ...orderSchemaDef,
  timestamp: { type: Date, required: true },
});
// @ts-ignore
let cached = global.orderModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.orderModel = { model: null, promise: null };
}
export default async function getOrderModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Order", orderSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
const expiryHours = parseInt(process.env.ORDER_EXPIRY || "60", 10);
const expirySeconds = expiryHours * 60 * 60;
const pendingOrderSchema = new Schema<OrderInterface>({
  ...orderSchemaDef,
  timestamp: {
    type: Date,
    required: true,
    expires: expirySeconds >= 1 ? expirySeconds : undefined,
  },
});

// @ts-ignore
let cachedPendingOrder = global.pendingOrderModel;
if (!cachedPendingOrder) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cachedPendingOrder = global.pendingOrderModel = {
    model: null,
    promise: null,
  };
}

export async function getPendingOrderModel() {
  if (cachedPendingOrder.model) return cachedPendingOrder.model;

  if (!cachedPendingOrder.promise) {
    const mongoose = await dbConnect();
    cachedPendingOrder.promise = mongoose.model(
      "PendingOrder",
      pendingOrderSchema
    );
  }
  cachedPendingOrder.model = await cachedPendingOrder.promise;
  return cachedPendingOrder.model;
}

// @ts-ignore
let cachedAwaitingVerificationOrder = global.awaitingVerificationOrderModel;
if (!cachedAwaitingVerificationOrder) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cachedAwaitingVerificationOrder = global.awaitingVerificationOrderModel = {
    model: null,
    promise: null,
  };
}

export async function getAwaitingVerificationModel() {
  if (cachedAwaitingVerificationOrder.model)
    return cachedAwaitingVerificationOrder.model;

  if (!cachedAwaitingVerificationOrder.promise) {
    const mongoose = await dbConnect();
    cachedAwaitingVerificationOrder.promise = mongoose.model(
      "AwaitingVerificationOrder",
      pendingOrderSchema
    );
  }
  cachedAwaitingVerificationOrder.model =
    await cachedAwaitingVerificationOrder.promise;
  return cachedAwaitingVerificationOrder.model;
}

export async function resolveOrder(id: string) {
  const OrderModel = await getOrderModel();
  let order = await OrderModel.findById(id);
  if (!order) {
    const PendingOrderModel = await getPendingOrderModel();
    order = await PendingOrderModel.findById(id);
    if (!order) {
      const AwaitingVerificationOrderModel =
        await getAwaitingVerificationModel();
      order = await AwaitingVerificationOrderModel.findById(id);
    }
  }
  return order;
}

export { orderSchema, pendingOrderSchema };
