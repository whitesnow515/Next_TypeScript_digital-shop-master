import { Types } from "mongoose";

export interface Metrics {
  _id: Types.ObjectId;
  metric: string;
  data: any;
  timestamp: Date;
}
