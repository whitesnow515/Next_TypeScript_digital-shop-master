import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import { AuditLogType } from "@app-types/audit";
import getAuditModel from "@models/audit";
import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "GET")) {
    try {
      const token = await requireLoggedIn(req, res, ["admin"], true);
      if (!token) {
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      const type: AuditLogType = req.query.type as AuditLogType;
      const extraQuery = req.query.extraQuery
        ? JSON.parse(req.query.extraQuery as string)
        : null;
      // go through the keys, and if the key ends with id, and the value is a 24 character string, convert it to an ObjectId
      if (extraQuery) {
        Object.keys(extraQuery).forEach((key) => {
          if (key.toLowerCase().endsWith("id")) {
            const value = extraQuery[key];
            if (typeof value === "string" && ObjectId.isValid(value)) {
              extraQuery[key] = new ObjectId(value);
            }
          }
        });
      }
      const redisClient = await getRedisClient();
      const redisKey = `audit-${type}-${page}-${limit}-${req.query.extraQuery}`;
      const cached = await redisClient.get(redisKey);
      if (cached) {
        res.status(200).json({
          success: true,
          ...JSON.parse(cached),
        });
        return;
      }
      const AuditModel = await getAuditModel();
      const data = await AuditModel.aggregate([
        ...(type || extraQuery
          ? [
              {
                $match: {
                  // ...(type ? { type } : {}),
                  ...(extraQuery || {}),
                },
              },
            ]
          : []),
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $facet: {
            search: [
              {
                $skip: page ? (page as number) * (limit as number) : 0,
              },
              {
                $limit: limit ? (limit as number) : 10,
              },
            ],
            size: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      
      let searchResults;
      let count = 0;
      if (!data) {
        searchResults = [];
        count = 0;
      } else {
        searchResults = data[0].search;
        if (data[0] && data[0].size) {
          count = data[0].size[0]?.count;
        }
      }
      const result = {
        data: searchResults,
        size: count,
      };
      await redisClient.set(redisKey, JSON.stringify(result), "EX", 30); // cache for 30s
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (e) {
      error(e);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
