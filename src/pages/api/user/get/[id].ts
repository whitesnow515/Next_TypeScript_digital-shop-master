import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const token = await requireLoggedIn(req, res, supportRoles, true);
      if (!token) {
        return;
      }
      const UserModel = await getUserModel();
      const { id } = req.query;
      if (!id) {
        res.status(400).json({
          success: false,
          message: "No id provided",
        });
        return;
      }
      const data: any = await UserModel.findById(id);
      if (!data) {
        res.status(400).json({
          success: false,
          message: "Could not find user",
        });
        return;
      }
      data.password = undefined;
      data.__v = undefined;
      res.status(200).json({
        success: true,
        message: "Successfully found user",
        data,
      });
    } catch (e) {
      error(e);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
