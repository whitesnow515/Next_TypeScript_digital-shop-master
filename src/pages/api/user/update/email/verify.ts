import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, supportRoles, true);
      if (!token) {
        return;
      }
      const UserModel = await getUserModel();

      const data = await UserModel.findOne({
        _id: req.body.id,
      });
      const { verify } = req.body;
      if (data) {
        if (verify) data.emailVerified = new Date();
        else data.emailVerified = null;
        await data.save();
        res.status(200).json({
          success: true,
          message: "Successfully updated user!",
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
