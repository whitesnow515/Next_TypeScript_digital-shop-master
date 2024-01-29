import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import { AuditLogType } from "@app-types/audit";
import getAuditModel from "@models/audit";
import requireLoggedIn, { hasRole } from "@util/AuthUtils";
import { error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "GET")) {
    try {
      const token = await requireLoggedIn(req, res, supportRoles, true);
      if (!token) {
        return;
      }
      if (!req.query.userId) {
        res.status(400).json({
          success: false,
          message: "userId not set",
        });
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      const admin = hasRole(token.user.roles, ["admin"]);
      const type: AuditLogType = "user";
      const redisClient = await getRedisClient();
      const redisKey = `audit-${type}-${req.query.userId}-${page}-${limit}-${admin}`;
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
        {
          $match: {
            type,
            "data.userId": new ObjectId(req.query.userId as string),
            ...(!admin && {
              "data.type": "user_change",
            }),
          },
        },
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
