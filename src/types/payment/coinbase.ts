export interface CoinbaseChargeMetadata {
  customer_id: string;
  customer_name: string;
  order_id: string;
}

export interface TimelineEvent {
  time: Date;
  status: string;
}

export interface CoinbaseMetadata {
  addresses: any;
  brand_color: string;
  brand_logo_url: string;
  cancel_url: string;
  code: string;
  coinbase_managed_merchant: boolean;
  created_at: Date;
  description: string;
  exchange_rates: any;
  expires_at: Date;
  fee_rate: number;
  fees_settled: boolean;
  hosted_url: string;
  id: string;
  local_exchange_rates: any;
  logo_url: string;
  metadata: any;
  name: string;
  offchain_eligible: boolean;
  organization_name: string;
  payment_threshold: any;
  payments: any[];
  pricing: any;
  pricing_type: string;
  pwcb_only: boolean;
  redirect_url: string;
  resource: string;
  support_email: string;
  timeline: TimelineEvent[];
  utxo: boolean;

  _notes: string;
}

export function setTypes(data: any): CoinbaseMetadata {
  // map strings to dates
  data.created_at = new Date(data.created_at);
  data.expires_at = new Date(data.expires_at);
  data.timeline = data.timeline.map((event: any) => {
    event.time = new Date(event.time);
    return event;
  });
  data._notes =
    "NOTE: This data is the response from CoinBase when the order was created.";
  return data;
}

// https://docs.cloud.coinbase.com/commerce/docs/webhooks-events
export type WebhookEventType =
  | "charge:created"
  | "charge:confirmed"
  | "charge:failed"
  | "charge:delayed"
  | "charge:pending"
  | "charge:resolved";

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  resource: string;
  api_version: string;
  created_at: Date;
  data: any;
}

export function setWebhookEventTypes(data: any): WebhookEvent {
  data.created_at = new Date(data.created_at);
  return data;
}
