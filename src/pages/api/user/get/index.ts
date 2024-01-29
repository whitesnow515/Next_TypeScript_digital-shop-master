import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
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
      const UserModel = await getUserModel();
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit cannot be greater than 100",
        });
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const username: string = (req.query.username as string) ?? null;
      const email: string = (req.query.email as string) ?? null;
      const id: string = (req.query.id as string) ?? null;
      // const roles: string[] = (req.query.roles as string || "").split(",");
      const data = await UserModel.aggregate([
        {
          $facet: {
            search: [
              ...(username || email || id
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
                          ...(id
                            ? [
                                {
                                  _id: {
                                    $regex: escapeRegExp(id),
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
      // remove password from result
      result.forEach((user: any) => {
        delete user.password;
      });
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
