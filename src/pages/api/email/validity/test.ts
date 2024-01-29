import { NextApiRequest, NextApiResponse } from "next";

import requireLoggedIn from "@util/AuthUtils";
import verifyEmailValidity from "@util/email/EmailVerifier";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const backendUrl = await getSetting("emailVerificationApiUrl", "");
      if (!backendUrl) {
        res.status(400).json({
          success: false,
          message: "Email verification API URL not set",
        });
        return;
      }
      const { email } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          message: "Missing email",
        });
        return;
      }
      const result = await verifyEmailValidity(email);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
