import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getAllowedEmailsModel from "@models/allowed-emails";
import requireLoggedIn from "@util/AuthUtils";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    try {
      const AllowedEmailModel = await getAllowedEmailsModel();
      const { email } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          message: "Missing email",
        });
        return;
      }
      // check existing
      const existing = await AllowedEmailModel.findOne({
        email: email.toLowerCase(),
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: "Email already exempt",
        });
        return;
      }
      const exempt = new AllowedEmailModel({
        email,
        addedByName: token.user.username,
        addedBy: new ObjectId(token.user._id),
      });
      await exempt.save();
      res.status(200).json({
        success: true,
        message: "Email exempted",
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
