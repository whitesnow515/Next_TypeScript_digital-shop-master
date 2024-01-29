import { ObjectId } from "bson";
import { Schema } from "mongoose";

import { AuditLogType } from "@app-types/audit";
import { AuditLog } from "@app-types/models/audit";
import dbConnect from "@lib/mongoose";

const expiryDays = parseInt(process.env.AUDIT_LOG_EXPIRY_DAYS || "-1", 10);
const expirySeconds = expiryDays * 24 * 60 * 60;
export const auditSchema = new Schema<AuditLog>(
  {
    data: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true },
    performerId: { type: Schema.Types.ObjectId },
    performerDisplayName: { type: String, default: "SYSTEM" },
    type: { type: String, required: true },
    ip: { type: String },
  },
  {
    timeseries: {
      timeField: "timestamp",
      granularity: "hour",
      metaField: "data",
    },
    expireAfterSeconds: expirySeconds,
    autoCreate: false,
  }
);

// @ts-ignore
let cached = global.auditModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.auditModel = { model: null, promise: null };
}
export default async function getAuditModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Audit", auditSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}

export async function saveAuditLog(
  data: any,
  auditName: AuditLogType,
  performer?: {
    id: string;
    displayName: string;
    ip?: string;
  }
) {
  const AuditModel = await getAuditModel();
  const audit = new AuditModel({
    data,
    timestamp: new Date(),
    type: auditName,
  });
  if (performer) {
    audit.performerId = new ObjectId(performer.id);
    audit.performerDisplayName = performer.displayName;
    if (performer.ip) {
      audit.ip = performer.ip;
    }
  }
  await audit.save();
}
