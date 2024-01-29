import { NextApiRequest, NextApiResponse } from "next";

import getAllowedEmailsModel from "@models/allowed-emails";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import escapeRegExp from "@util/regex";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    try {
      const AllowedEmailModel = await getAllowedEmailsModel();
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit cannot be greater than 100",
        });
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const email: string = (req.query.email as string) ?? "";
      const filter = [
        ...(email
          ? [
              {
                $match: {
                  email: { $regex: escapeRegExp(email), $options: "i" },
                },
              },
            ]
          : []),
      ];
      const data = await AllowedEmailModel.aggregate([
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
    } catch (e) {
      log(e);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
}
