import { Types } from "mongoose";

import { FileMeta } from "@app-types/models/filemeta";

export interface FileInterface {
  _id?: Types.ObjectId;
  __v?: string;
  data: Buffer;
  type: string;
  metadata?: FileMeta | null;
}
