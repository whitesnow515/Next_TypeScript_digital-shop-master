import mongoose, { Schema } from "mongoose";

import { Stock, UsedStock } from "@app-types/models/stock";
import dbConnect from "@lib/mongoose";

const base = {
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
  data: { type: [String], required: false, default: [] },
};
const stockSchema = new Schema<Stock>(base);
// @ts-ignore
let cached = global.stockModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.stockModel = { model: null, promise: null };
}
export default async function getStockModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Stock", stockSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}

const usedStockSchema = new Schema<UsedStock>({
  ...base,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null,
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, required: true },
  replacement: { type: Boolean, required: false, default: false },
});

// @ts-ignore
let cachedUsed = global.usedStockModel;
if (!cachedUsed) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cachedUsed = global.usedStockModel = { model: null, promise: null };
}

export async function getUsedStockModel() {
  if (cachedUsed.model) return cachedUsed.model;

  if (!cachedUsed.promise) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const mongoose = await dbConnect();
    cachedUsed.promise = mongoose.model("UsedStock", usedStockSchema);
  }
  cachedUsed.model = await cachedUsed.promise;
  return cachedUsed.model;
}

export { stockSchema, usedStockSchema };
