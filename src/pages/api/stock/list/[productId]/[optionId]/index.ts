import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getStockModel from "@models/stock";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Finish this
  if (requireMethod(req, res, "GET")) {
    if (!(await requireLoggedIn(req, res, supportRoles, true))) {
      return;
    }
    const { productId, optionId } = req.query;
    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Missing productId",
      });
      return;
    }
    if (!optionId) {
      res.status(400).json({
        success: false,
        message: "Missing optionId",
      });
      return;
    }
    if (typeof productId !== "string" || !ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid productId",
      });
      return;
    }
    if (typeof optionId !== "string" || !ObjectId.isValid(optionId)) {
      res.status(400).json({
        success: false,
        message: "Invalid optionId",
      });
      return;
    }
    // get query params page, limit
    const limit: number = parseInt(req.query.limit as string, 10) || 15;
    if (limit > 100) {
      res.status(400).json({
        success: false,
        message: "Limit cannot be greater than 100",
      });
      return;
    }
    const page: number = parseInt(req.query.page as string, 10) || 0;
    const before: Date = req.query.before
      ? new Date(req.query.before as string)
      : new Date();
    const after: Date = req.query.after
      ? new Date(req.query.after as string)
      : new Date(0);
    const StockModel = await getStockModel();
    const used = req.query.used as string;
    const query: any = {
      productId: new ObjectId(productId as string),
      optionId: new ObjectId(optionId as string),
      used: used === "true",
    };
    const anyUsed = req.query.anyUsed as string;
    if (anyUsed) {
      delete query.used;
    }
    log({ query });
    const stock = await StockModel.aggregate([
      {
        $facet: {
          search: [
            {
              $match: {
                ...query,
                timestamp: {
                  $gte: after,
                  $lte: before,
                },
              },
            },
            {
              $sort: {
                timestamp: -1,
              },
            },
            {
              $skip: page ? (page as number) * (limit as number) : 0,
            },
            {
              $limit: limit ? (limit as number) : 10,
            },
            {
              $project: {
                __v: 0,
                data: 0, // exclude data and __v
              },
            },
          ],
          size: [
            {
              $match: {
                ...query,
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
    ]);
    const obj = stock[0];
    if (!obj) {
      res.status(400).json({
        success: false,
        message: "No stock found!",
      });
      return;
    }
    const size = obj.size[0]?.count;
    const result = obj?.search;
    const totalPages = Math.ceil(size / limit);
    res.status(200).json({
      success: true,
      limit,
      page,
      totalPages,
      size,
      result,
    });
  }
}

export default handler;
