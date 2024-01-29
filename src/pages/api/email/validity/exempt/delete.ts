import { NextApiRequest, NextApiResponse } from "next";

import getAllowedEmailsModel from "@models/allowed-emails";
import requireLoggedIn from "@util/AuthUtils";
import { supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST", "DELETE")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    try {
      const AllowedEmailModel = await getAllowedEmailsModel();
      const { email, id } = req.body;
      if (!email && !id) {
        res.status(400).json({
          success: false,
          message: "Missing email or id",
        });
        return;
      }
      let data;
      if (id) {
        data = await AllowedEmailModel.findById(id).exec();
      } else {
        data = await AllowedEmailModel.findOne({
          email: email.toLowerCase(),
        }).exec();
      }
      if (!data) {
        res.status(400).json({
          success: false,
          message: "Email not exempt",
        });
        return;
      }
      await data.delete();
      res.status(200).json({
        success: true,
        message: "Email unexempted",
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
