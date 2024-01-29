import { Types } from "mongoose";

export interface AllowedEmail {
  email: string;
  addedByName: string;
  addedBy?: Types.ObjectId;
  addedAt: Date;
}
