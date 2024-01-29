import { Types } from "mongoose";

import { PaymentProviderNames } from "@app-types/payment/providers";

export interface ProviderSalesMetric {
  count: number;
  revenue: number;
}
export interface SalesMetric {
  _id: string;
  ordersPaid: ProviderSalesMetric;
  cashAppPaid: ProviderSalesMetric;
  coinbasePaid: ProviderSalesMetric;
}

export interface OrderMetricBase {
  orderId: Types.ObjectId;
  userId?: Types.ObjectId;
  guest: boolean;
  price?: number;
}

export interface OrderCreatedMetric extends OrderMetricBase {}

export interface OrdersPaidMetric extends OrderCreatedMetric {}

export interface PaymentProviderOrderCreatedMetric extends OrderMetricBase {
  provider: PaymentProviderNames;
}

export interface PaymentProviderOrderPaidMetric extends OrderMetricBase {
  provider: PaymentProviderNames;
}

export const ordersCreatedMetricName = "ordersCreated";
export const ordersPaidMetricName = "ordersPaid";
export const cashAppCreatedMetricName = "cashAppCreated";
export const cashAppPaidMetricName = "cashAppPaid";
export const coinbaseCreatedMetricName = "coinbaseCreated";
export const coinbasePaidMetricName = "coinbasePaid";
