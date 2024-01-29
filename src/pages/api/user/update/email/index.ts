import { render } from "@react-email/render";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import ConfirmEmail from "@emails/ConfirmEmail";
import getUserModel from "@models/user";
import { AppConfig } from "@util/AppConfig";
import requireLoggedIn from "@util/AuthUtils";
import withCaptcha from "@util/CaptchaUtils";
import { emailRegex } from "@util/commons";
import getEmailSender from "@util/email/EmailManager";
import verifyEmailValidity from "@util/email/EmailVerifier";
import escapeRegExp from "@util/regex";
import { getBaseUrl } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }
  const token = await requireLoggedIn(req, res, ["user"], true);
  if (!token) return;
  const { email } = req.body;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid request" });
    return;
  }
  const UserModel = await getUserModel();
  const lowerEmail = email.toLowerCase();
  const valid = await verifyEmailValidity(lowerEmail);
  if (!valid.success) {
    res.status(422).json({
      success: false,
      message: valid.message,
    });
    return;
  }
  // check if email is already in use
  const exists = await UserModel.exists({
    email: {
      $regex: new RegExp(`^${escapeRegExp(email)}$`, "i"),
    },
  }).exec();
  if (exists) {
    res
      .status(400)
      .json({ success: false, message: "Email is already in use" });
    return;
  }
  const { user }: any = token;
  if (user.email === email) {
    res.status(400).json({ success: false, message: "Email is the same" });
    return;
  }
  const verifyToken = jwt.sign(
    { id: user.id, email, use: "verify_existing" },
    `${process.env.NEXTAUTH_SECRET}`,
    {
      expiresIn: "12h",
    }
  );
  const verifyLink = `${getBaseUrl()}/auth/verify/email/${verifyToken}`;
  const htmlEmail = ConfirmEmail({
    username: user.username,
    verifyLink,
    newAccount: false,
    title: AppConfig.title,
  });
  const html = render(htmlEmail);
  await getEmailSender().sendEmail(
    email,
    "Confirm your email address",
    html,
    `Please confirm your email address by following the link: ${verifyLink}`
  );

  res.status(200).json({
    success: true,
    message: "Verification email sent. Check your inbox.",
  });
}

export default withCaptcha(handler);
