import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { hasAuthorityOver } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, ["support"], true);
      if (!token) {
        return;
      }
      const UserModel = await getUserModel();

      const data = await UserModel.findOne({
        _id: req.body.id,
      });

      if (data) {
        // check role hierarchy
        if (!hasAuthorityOver(token.user.roles, data.roles)) {
          res.status(400).json({
            success: false,
            message:
              "You cannot ban someone with the same/higher role than you.",
          });
          return;
        }
        const { reason } = req.body;
        data.banned = {
          bannedByName: token.user.username,
          bannedBy: token.user._id,
          reason: reason || "No reason provided",
          date: new Date(),
        };
        await data.save();
        res.status(200).json({
          success: true,
          message: "Successfully banned user!",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Could not find user.",
        });
      }
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
