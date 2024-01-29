import { Schema } from "mongoose";

import { FileInterface } from "@app-types/models/file";
import dbConnect from "@lib/mongoose";
import fileMetaSchema from "@models/filemeta";

const fileSchema = new Schema<FileInterface>({
  data: { type: Buffer, required: true },
  type: { type: String, required: true },
  metadata: { type: fileMetaSchema, default: null },
});
// @ts-ignore
let cached = global.fileModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.fileModel = { model: null, promise: null };
}
export default async function getFileModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("File", fileSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
export { fileSchema };
