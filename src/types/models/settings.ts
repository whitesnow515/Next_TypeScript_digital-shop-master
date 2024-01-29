import { Types } from "mongoose";

export interface SettingInterface {
  _id?: Types.ObjectId;
  __v?: string;
  key: string;
  value: any;
}
