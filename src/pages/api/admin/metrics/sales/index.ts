import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";

import {
  cashAppPaidMetricName,
  coinbasePaidMetricName,
  ordersPaidMetricName,
} from "@app-types/metrics/SalesMetrics";
import getMetricsModel from "@models/metrics";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const MetricsModel = await getMetricsModel(); // time-series data
      // 7 days ago
      const from = req.query.from
        ? new Date(req.query.from as string)
        : moment().subtract(7, "days").toDate();
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const key = `metrics:sales:${from.toISOString()}:${to.toISOString()}`;
      const redisClient = await getRedisClient();
      const cached = await redisClient.get(key);
      if (cached && process.env.NODE_ENV !== "development") {
        res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
        return;
      }
      // we want to return a count for each day
      const getPipeline = (metrics: string[]) => {
        const pipeline = [
          {
            $match: {
              timestamp: {
                $gte: from,
                $lt: to,
              },
              metric: { $in: metrics },
            },
          },
          {
            $group: {
              _id: {
                metric: "$metric",
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
                },
              },
              count: { $sum: 1 },
              revenue: { $sum: "$data.price" },
            },
          },
          {
            $group: {
              _id: "$_id.date",
              metrics: {
                $push: {
                  metric: "$_id.metric",
                  count: "$count",
                  revenue: "$revenue",
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              metrics: {
                $arrayToObject: {
                  $map: {
                    input: "$metrics",
                    in: {
                      k: "$$this.metric",
                      v: {
                        count: "$$this.count",
                        revenue: "$$this.revenue",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ];

        return pipeline;
      };

      const metricsNames = [
        ordersPaidMetricName,
        cashAppPaidMetricName,
        coinbasePaidMetricName,
      ];
      const pipeline = getPipeline(metricsNames);
      const data = await MetricsModel.aggregate(pipeline);

      const result: any = [];
      const datesBetween = moment(to).diff(moment(from), "days");

      for (let i = 0; i <= datesBetween; i += 1) {
        const date = moment(from).add(i, "days").format("YYYY-MM-DD");
        const found = data.find((d: any) => d._id === date);
        if (found) {
          const { metrics } = found;
          let count = 0;
          let revenue = 0;
          metricsNames
            .filter((metric) => metric !== ordersPaidMetricName)
            .forEach((metricName) => {
              const metric = metrics[metricName];
              if (metric) {
                count += metric.count;
                revenue += metric.revenue;
              }
            });
          revenue = Math.round(revenue * 100) / 100; // round to 2 decimal places
          metrics[ordersPaidMetricName] = { count, revenue };
          if (!metrics[cashAppPaidMetricName]) {
            metrics[cashAppPaidMetricName] = { count: 0, revenue: 0 };
          }
          if (!metrics[coinbasePaidMetricName]) {
            metrics[coinbasePaidMetricName] = { count: 0, revenue: 0 };
          }
          result.push({ _id: date, ...found.metrics });
        } else {
          result.push({
            _id: date,
            [ordersPaidMetricName]: { count: 0, revenue: 0 },
            [cashAppPaidMetricName]: { count: 0, revenue: 0 },
            [coinbasePaidMetricName]: { count: 0, revenue: 0 },
          });
        }
      }

      await redisClient.set(key, JSON.stringify(result), "EX", 60 * 3);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      log(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
