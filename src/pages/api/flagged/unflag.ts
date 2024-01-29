import { NextApiRequest, NextApiResponse } from "next";

import getFlaggedEmailModel from "@models/flaggedemails";
import requireLoggedIn from "@util/AuthUtils";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST", "DELETE")) {
    const token = await requireLoggedIn(req, res, ["support"], true);
    if (!token) {
      return;
    }
    try {
      const FlaggedModel = await getFlaggedEmailModel();
      const { email, id } = req.body;
      if (!email && !id) {
        res.status(400).json({
          success: false,
          message: "Missing email or id",
        });
        return;
      }
      // delete
      /*
      const data = await FlaggedModel.findOne({
        email: email.toLowerCase(),
      }).exec();
       */
      let data;
      if (id) {
        data = await FlaggedModel.findById(id).exec();
      } else {
        data = await FlaggedModel.findOne({
          email: email.toLowerCase(),
        }).exec();
      }
      if (!data) {
        res.status(400).json({
          success: false,
          message: "Email not flagged",
        });
        return;
      }
      await data.delete();
      res.status(200).json({
        success: true,
        message: "Email unflagged",
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
