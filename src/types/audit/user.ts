import { Types } from "mongoose";

export type UserBalChangeType = "add" | "subtract" | "set";
export type UserBalUpdateLog = {
  type: "staff_change" | "user_change";
  userId: Types.ObjectId;
  change: UserBalChangeType;
  reason: string;
  amount: number;
  orderId?: Types.ObjectId | null;
  before: number;
  after: number;
};
