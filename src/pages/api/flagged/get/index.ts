import { NextApiRequest, NextApiResponse } from "next";

import getFlaggedEmailModel from "@models/flaggedemails";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import escapeRegExp from "@util/regex";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    try {
      const FlaggedModel = await getFlaggedEmailModel();
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit cannot be greater than 100",
        });
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const username: string = (req.query.username as string) ?? "";
      const email: string = (req.query.email as string) ?? "";
      const reason: string = (req.query.reason as string) ?? "";
      const filter = [
        ...(username || email || reason
          ? [
              {
                $match: {
                  $or: [
                    ...(username
                      ? [
                          {
                            username: {
                              $regex: escapeRegExp(username),
                              $options: "i",
                            },
                          },
                        ]
                      : []),
                    ...(email
                      ? [
                          {
                            email: {
                              $regex: escapeRegExp(email),
                              $options: "i",
                            },
                          },
                        ]
                      : []),
                    ...(reason
                      ? [
                          {
                            reason: {
                              $regex: escapeRegExp(reason),
                              $options: "i",
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
            ]
          : []),
      ];
      const data = await FlaggedModel.aggregate([
        {
          $facet: {
            search: [
              ...filter,
              {
                $skip: page ? (page as number) * (limit as number) : 0,
              },
              {
                $limit: limit ? (limit as number) : 10,
              },
            ],
            size: [
              ...filter,
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      const obj = data[0];
      if (!obj) {
        res.status(500).json({
          success: false,
          message: "Something went wrong",
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
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
