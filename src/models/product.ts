import mongoose, { Schema } from "mongoose";

import { ProductInterface, ProductOption } from "@app-types/models/product";
import dbConnect from "@lib/mongoose";

const productCategorySchema = new Schema<{ name: string }>({
  name: { type: String, required: true },
});

const productOptionSchema = new Schema<ProductOption>({
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  timesBought: { type: Number, default: 0 },
  default: { type: Boolean, default: false },
  warrantyEnabled: { type: Boolean, default: true },
  warrantyHours: { type: Number, default: 0 }, // if enabled, but no hours, then it's infinite
  // by default, the product's warranty is inherited
  holdAllOrders: { type: Boolean, default: false },
  // @ts-ignore
  uniqid :String,
  category: String,
  stockLines: { type: Number, default: 1 }, // # of lines of stock to distribute on purchase (per quantity)
  hidden: { type: Boolean, default: false },
  totalStockLines: { type: Number, default: 0 },
});
const productSchema = new Schema<ProductInterface & {uniqid: string, category?:any, minimum?: number, maximum?: number}>({
  name: { type: String, required: true },
  image: { type: String },
  bannerImage: { type: String },
  minimum: {type: Number, required: false},
  maximum: {type: Number, required: false},
  category:  {
  type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
},
  timesBought: { type: Number, required: true },
  fitBanner: { type: Boolean, default: false },
  options: { type: [productOptionSchema], required: true },
  description: { type: String },
  shortDescription: { type: String },
  warrantyEnabled: { type: Boolean, default: true },
  warrantyHours: { type: Number, default: 0 },
  holdAllOrders: { type: Boolean, default: false },
    uniqid:String,
  note: { type: String, default: "" },
  sort: { type: String, default: "value" },
  hidden: { type: Boolean, default: false },
  lastStocked: { type: Date },
  totalStockLines: { type: Number, default: 0 },
  stockCheckerConfig: {
    type: Schema.Types.Mixed,
    default: {
      enabled: false,
      name: "",
      keycheck: "",
      wordlisttype: "Credentials",
      enableAutoReplace: false,
      enableAutoCheck: false,
      proxies: [],
    },
  },
});



// @ts-ignore
let cached = global.productModel;
{/* @ts-ignore */}
let cached2 = global.productCategoryModel;

if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.productModel = { model: null, promise: null };
}


if (!cached2) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached2 = global.productCategoryModel = { model: null, promise: null };
}

export async function getProductCategoryModel() {
  if (cached2.model) return cached2.model;

  if (!cached2.promise) {
    const mongoose = await dbConnect();
    cached2.promise = mongoose.model("ProductCategory", productCategorySchema);
  }
  cached2.model = await cached2.promise;
  return cached2.model;

}
export default async function getProductModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Product", productSchema);
  }
  cached.model = await cached.promise;
  return cached.model;

}
export { productOptionSchema};
