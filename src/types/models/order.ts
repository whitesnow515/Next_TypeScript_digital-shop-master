import { Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "awaiting-verification"
  | "completed"
  | "cancelled"
  | "refunded"
  | "out-of-stock";
export const orderStatuses: OrderStatus[] = [
  "pending",
  "awaiting-verification",
  "completed",
  "cancelled",
  "refunded",
  "out-of-stock",
];
export const safeStatuses: OrderStatus[] = [
  // a array of statuses that don't actually do anything
  // so is safe for support to change
  "completed",
  "cancelled",
  "refunded",
  "out-of-stock",
];

export interface StockInfoInterface {
  id?: Types.ObjectId;
  replacement?: boolean;
  firstAccessed?: Date;
  lastAccessed?: Date;
}

export interface SubOrderInterface {
  product?: Types.ObjectId;
  productName: string;
  productPrice: number;
  productQuantity: number;
  productOption: string;
  productOptionId?: Types.ObjectId;
  productShortDescription: string;
  stocks?: StockInfoInterface[];
  warrantyHours?: number;
  warrantyEnabled?: boolean;
  stockLines?: number;
}

export interface OrderInterface {
  _id?: Types.ObjectId;
  __v?: string;
  status?: OrderStatus;
  user?: Types.ObjectId;
  email?: string;
  username?: string;
  ip?: string;
  timestamp: Date;
  metadata?: any;
  subOrders?: SubOrderInterface[];
  notes?: string;
  paymentMethod?: string;
  paid?: boolean;
  totalPriceStr?: string; // original price string, such as 1.00 BTC, or 1.00 USD
  totalPrice?: number;
  userBalanceSpent?: number;
  shortId?: string;
  image?: string;
  warrantyStartTimestamp?: Date;
  fee?: number;
  originalPrice?: number;
}

/*
export interface CheckoutOrderInterface {
  productId: string;
  optionId: string;
  quantity: number;
  paymentMethod: PaymentProviderNames;
  timestamp: Date;
  shortId?: string;
  totalPrice: number;
}
 */
export function getWarrantyExpiryDate(
  order: OrderInterface,
  defaultTimestamp = true
): Date | null {
  const { subOrders } = order;
  if (!subOrders || subOrders.length === 0) {
    return null;
  }
  const subOrder = subOrders[0];
  if (!subOrder || !subOrder.warrantyEnabled || !subOrder.warrantyHours) {
    return null;
  }
  let warrantyExpiryDate = order.warrantyStartTimestamp;
  if (!warrantyExpiryDate && defaultTimestamp) {
    warrantyExpiryDate = new Date(order.timestamp);
  } else if (!warrantyExpiryDate) {
    return null;
  }
  // noinspection SuspiciousTypeOfGuard
  if (typeof warrantyExpiryDate === "string") {
    warrantyExpiryDate = new Date(warrantyExpiryDate);
  }
  warrantyExpiryDate.setHours(
    warrantyExpiryDate.getHours() + subOrder.warrantyHours
  );
  return warrantyExpiryDate;
}

export function cleanSensitiveOrderData(order: any, removeMetadata = true) {
  const o = JSON.parse(JSON.stringify(order));
  if (removeMetadata) delete o.metadata;
  if (order.metadata && order?.metadata?.awaitingAccept) {
    o.metadata = {
      ...order?.metadata,
      awaitingAccept: order?.metadata?.awaitingAccept,
    };
  }
  delete o.notes;
  return o;
}
