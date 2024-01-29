import { Schema } from "mongoose";

import { AllowedEmail } from "@app-types/models/allowed-emails";
import dbConnect from "@lib/mongoose";

const allowedEmailsSchema = new Schema<AllowedEmail>({
  email: { type: String, required: true, unique: true },
  addedByName: { type: String, required: true },
  addedBy: { type: Schema.Types.ObjectId, required: false },
  addedAt: { type: Date, default: Date.now },
});
// @ts-ignore
let cached = global.allowedEmailsModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.allowedEmailsModel = { model: null, promise: null };
}
export default async function getAllowedEmailsModel() {
  if (cached.model) return cached.model;
  if (!cached.promise) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("AllowedEmail", allowedEmailsSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
export { allowedEmailsSchema };
