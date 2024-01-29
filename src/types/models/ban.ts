import { Types } from "mongoose";

export interface Ban {
  bannedByName: string;
  bannedBy: Types.ObjectId;
  reason: string;
  date: Date;
}
