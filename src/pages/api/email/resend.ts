import { NextApiRequest, NextApiResponse } from "next";

import requireLoggedIn from "@util/AuthUtils";
import withCaptcha from "@util/CaptchaUtils";
import { log } from "@util/log";
import withRateLimit from "@util/RateLimit";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    // get the user
    const token = await requireLoggedIn(req, res, ["user"], true);
    log("token", token);
    if (!token) {
      return;
    }
    const { emailName } = req.body;
    if (!emailName) {
      res.status(500).json({ success: false, message: "Email name not set" });
      return;
    }
    const { user } = token;
    if (!user) {
      res.status(400).json({ success: false, message: "User not found" });
      return;
    }
    switch (emailName.toLowerCase()) {
      case "email_verify": {
        if (user.emailVerified) {
          res.status(400).json({
            success: false,
            message: "Email already verified",
          });
          return;
        }
        const sent = await user.sendEmailVerification();
        res.status(200).json({ success: sent, message: "Email sent" });
        break;
      }
      default: {
        res
          .status(400)
          .json({ success: false, message: "Email name not valid" });
      }
    }
  }
}

export default withCaptcha(withRateLimit(handler, 3, 60));
