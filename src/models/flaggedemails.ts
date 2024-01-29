import { Schema } from "mongoose";

import { FlaggedEmail } from "@app-types/models/flaggedemails";
import dbConnect from "@lib/mongoose";

const flaggedEmailSchema = new Schema<FlaggedEmail>({
  email: { type: String, required: true, unique: true },
  reason: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, required: false },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, required: false },
  holdAllOrders: { type: Boolean, default: false },
});
// @ts-ignore
let cached = global.flaggedEmailModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.flaggedEmailModel = { model: null, promise: null };
}
export default async function getFlaggedEmailModel() {
  if (cached.model) return cached.model;
  if (!cached.promise) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("FlaggedEmail", flaggedEmailSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
export { flaggedEmailSchema };
