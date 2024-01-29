import mongoose, { Schema } from "mongoose";

import { SettingInterface } from "@app-types/models/settings";
import dbConnect from "@lib/mongoose";

const settingSchema = new Schema<SettingInterface>({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});
// @ts-ignore
let cached = global.settingModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.settingModel = { model: null, promise: null };
}
export default async function getSettingsModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Setting", settingSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
export { settingSchema };
