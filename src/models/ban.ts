import mongoose, { Schema } from "mongoose";

import { Ban } from "@app-types/models/ban";

const banSchema = new Schema<Ban>({
  bannedByName: { type: String },
  bannedBy: { type: mongoose.Schema.Types.ObjectId },
  reason: { type: String, default: "No reason provided." },
  date: { type: Date, default: new Date() },
});
export default banSchema;
