import { Types } from "mongoose";

export interface Stock {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  optionId: Types.ObjectId;
  metadata?: any;
  data?: string[];
}

export interface UsedStock extends Stock {
  user?: Types.ObjectId;
  orderId: Types.ObjectId;
  timestamp: Date;
  replacement?: boolean;
}
