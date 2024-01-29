import { Types } from "mongoose";

import { OrderStatus } from "@app-types/models/order";

export type OrderLogSubtypes =
  | "add_replacement"
  | "remove_stock"
  | "set_status"
  | "completed"
  | "approve"
  | "deny"
  | "delete_order"
  | "note_change";
export interface GenericOrderLog {
  type: OrderLogSubtypes;
  orderId: Types.ObjectId;
}
export interface AddReplacementLog extends GenericOrderLog {
  type: "add_replacement";
  replacementId: Types.ObjectId;
  reason: string;
}
export interface SetStatusLog extends GenericOrderLog {
  type: "set_status";
  status: OrderStatus;
  reason: string;
  stockAdded?: boolean;
}
export interface OrderNoteChangeLog extends GenericOrderLog {
  type: "note_change";
  before: string;
  after: string;
}
