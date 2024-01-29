import { Schema } from "mongoose";

import { FileMeta } from "@app-types/models/filemeta";

const fileMetaSchema = new Schema<FileMeta>({
  type: { type: String },
});
export default fileMetaSchema;
