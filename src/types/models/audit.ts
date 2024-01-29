import { Types } from "mongoose";

import { AuditLogType } from "@app-types/audit";

export interface AuditLog {
  _id: Types.ObjectId;
  type: AuditLogType;
  data: any;
  performerId?: Types.ObjectId;
  performerDisplayName?: string;
  timestamp: Date;
  ip?: string;
}
