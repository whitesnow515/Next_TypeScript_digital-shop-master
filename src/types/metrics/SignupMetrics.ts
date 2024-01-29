import { Types } from "mongoose";

export type SignupMetrics = {
  userId: Types.ObjectId;
  username: string;
};
export const signupMetricName = "signup";
