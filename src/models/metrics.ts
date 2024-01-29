import { Schema } from "mongoose";

import { Metrics } from "@app-types/models/metrics";
import dbConnect from "@lib/mongoose";
import { debug } from "@util/log";

const expiryDays = parseInt(process.env.METRICS_EXPIRY_DAYS || "-1", 10);
const expirySeconds = expiryDays * 24 * 60 * 60;
export const metricsSchema = new Schema<Metrics>(
  {
    metric: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true },
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
let cached = global.metricsModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.metricsModel = { model: null, promise: null };
}
export default async function getMetricsModel() {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("Metric", metricsSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}

export async function saveMetric(data: any, metricName: string) {
  if (process.env.ENABLE_METRICS !== "true") {
    return;
  }
  debug("Saving metric", metricName, data);
  const MetricsModel = await getMetricsModel();
  const metric = new MetricsModel({
    metric: metricName,
    data,
    timestamp: new Date(),
  });
  await metric.save();
}
