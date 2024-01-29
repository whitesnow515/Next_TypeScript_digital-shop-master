import { NextApiRequest, NextApiResponse } from "next";

import getFlaggedEmailModel from "@models/flaggedemails";
import requireLoggedIn from "@util/AuthUtils";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    requireMethod(req, res, "POST") &&
    (await requireLoggedIn(req, res, ["support"], true))
  ) {
    const { email, reason } = req.body;
    if (!email || !reason) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }
    const FlaggedEmail = await getFlaggedEmailModel();
    // find email, update reason
    const data = await FlaggedEmail.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        reason,
      }
    ).exec();
    if (!data) {
      res.status(400).json({
        success: false,
        message: "Email not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Reason updated.",
    });
  }
}
