import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import withCaptcha from "@util/CaptchaUtils";
import { emailRegex } from "@util/commons";
import withRateLimit from "@util/RateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email } = req.body;
    if (!email || !emailRegex.test(email)) {
      res.status(422).json({ error: true, message: "Invalid Email" });
      return;
    }
    // Connect with database
    const UserModel = await getUserModel();
    // Check existing
    const user = await UserModel.findOne({
      email,
    }).exec();
    if (!user) {
      res.status(422).json({
        // error: true,
        // message: "User not found",
        error: false,
        message:
          "Password reset email sent. Please check your inbox for further instructions.",
        // we don't want to leak whether a user exists or not
      });
      return;
    }
    // @ts-ignore this method exists
    await user.sendPasswordResetEmail();
    res.status(200).json({
      error: false,
      message:
        "Password reset email sent. Please check your inbox for further instructions.",
    });
  } else {
    // Response for other than POST method
    res
      .status(400)
      .json({ error: true, success: false, message: "Invalid Route" });
  }
}

export default withCaptcha(withRateLimit(handler, 3, 60));
