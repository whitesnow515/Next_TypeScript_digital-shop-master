import { Types } from "mongoose";

export type SigninMetrics = {
  userId: Types.ObjectId;
};
export const signinMetricName = "signin";
