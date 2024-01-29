import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";

import {
  cashAppCreatedMetricName,
  cashAppPaidMetricName,
  coinbaseCreatedMetricName,
  coinbasePaidMetricName,
  ordersCreatedMetricName,
  ordersPaidMetricName,
} from "@app-types/metrics/SalesMetrics";
import getMetricsModel from "@models/metrics";
import requireLoggedIn, { hasRole } from "@util/AuthUtils";
import { log } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

const adminOnlyMetrics = [
  ordersPaidMetricName,
  ordersCreatedMetricName,
  cashAppCreatedMetricName,
  cashAppPaidMetricName,
  coinbaseCreatedMetricName,
  coinbasePaidMetricName,
];
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
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
      const id = (req.query.id as string)?.split(",") || [];
      const admin = hasRole(token.user.roles, ["admin"]);
      // if any of the metrics are admin-only, then the user must be an admin
      if (!admin && id.some((metric) => adminOnlyMetrics.includes(metric))) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
        });
        return;
      }
      const redisKey = `metrics:${
        req.query.id
      }:${from.toISOString()}:${to.toISOString()}`;
      const redisClient = await getRedisClient();
      const cached = await redisClient.get(redisKey);
      if (cached && process.env.NODE_ENV !== "development") {
        res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
        return;
      }
      // we want to return a count for each day
      const pipeline = [
        {
          $match: {
            timestamp: {
              $gte: from,
              $lt: to,
            },
            metric: { $in: id },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              metric: "$metric",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.metric",
            data: {
              $push: {
                _id: "$_id.date",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            metric: "$_id",
            data: 1,
          },
        },
      ];
      const data = await MetricsModel.aggregate(pipeline);
      const result: any = {};
      data.forEach((item: any) => {
        result[item.metric] = item.data;
      });
      // go through result, and fill in missing dates
      const datesBetween = moment(to).diff(moment(from), "days");
      id.forEach((metric) => {
        if (!result[metric]) {
          result[metric] = [];
        }
        const dates = result[metric].map((item: any) => item._id);
        for (let i = 0; i < datesBetween; i += 1) {
          const date = moment(from).add(i, "days").format("YYYY-MM-DD");
          if (!dates.includes(date)) {
            result[metric].push({ _id: date, count: 0 });
          }
        }
        result[metric].sort((a: any, b: any) => {
          return moment(a._id).diff(moment(b._id));
        });
      });
      // expire every 3 minutes
      await redisClient.set(redisKey, JSON.stringify(result), "EX", 180);
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
