import { NextApiRequest, NextApiResponse } from "next";

import getFlaggedEmailModel from "@models/flaggedemails";
import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["support"], true);
    if (!token) {
      return;
    }
    try {
      const FlaggedModel = await getFlaggedEmailModel();
      const { email, reason } = req.body;
      if (!email || !reason) {
        res.status(400).json({
          success: false,
          message: "Missing email or reason",
        });
        return;
      }
      // check existing
      const existing = await FlaggedModel.findOne({
        email: email.toLowerCase(),
      }).exec();
      if (existing) {
        res.status(400).json({
          success: false,
          message: "Email already flagged",
        });
        return;
      }
      const UserModel = await getUserModel();
      const user = await UserModel.findOne({
        email,
      }).exec();
      if (user?.verified) {
        user.verified = false;
        await user.save();
      }
      const flagged = new FlaggedModel({
        email,
        reason,
        createdAt: new Date(),
        ...(user
          ? {
              user: user._id,
              username: user.username,
            }
          : {}),
      });
      await flagged.save();
      res.status(200).json({
        success: true,
        message: "Email flagged",
        id: flagged._id.toString(),
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
