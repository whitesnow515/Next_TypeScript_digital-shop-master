import { Types } from "mongoose";

export interface FlaggedEmail {
  _id?: Types.ObjectId;
  email: string;
  reason: string;
  createdAt: Date;
  user?: Types.ObjectId;
  username?: string;
  holdAllOrders?: boolean; // should all orders be held for review
}
