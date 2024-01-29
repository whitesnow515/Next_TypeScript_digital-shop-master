import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { verifyCaptcha } from "@util/CaptchaUtils";
import { isAdmin } from "@util/ClientUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // reset password
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }
  const token = await requireLoggedIn(req, res, ["user"], true);
  if (!token) return;
  const { currentPassword, newPassword } = req.body;
  if (!newPassword) {
    res.status(400).json({ success: false, message: "Invalid request" });
    return;
  }
  const userQuery = req.query.user;
  let user;
  if (userQuery) {
    if (!isAdmin(token.user)) {
      res.status(401).json({
        error: true,
        message: "You do not have the required permissions.",
      });
      return;
    }
    const UserModel = await getUserModel();
    user = await UserModel.findById(userQuery.toString()).exec();
    if (!user) {
      res.status(400).json({
        error: true,
        message: "User not found.",
      });
      return;
    }
  }
  if (!user) {
    // we don't have a captcha on the admin panel
    const captchaVerified = await verifyCaptcha(req, res);
    if (!captchaVerified) {
      return;
    }
    user = token.user;
    if (!currentPassword) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }
    if (!(await compare(currentPassword, user.password).catch(() => false))) {
      res.status(401).json({ success: false, message: "Invalid password" });
      return;
    }
  }
  user.password = await hash(newPassword, 12);
  await user.save();
  if (userQuery) {
    res.status(200).json({ success: true, message: "Password updated" });
    return;
  }
  const refreshTokenObject = {
    id: user.id,
    email: user.email,
    username: user.username,
    use: "refresh",
    origin: "change-password",
  };
  const refreshToken = jwt.sign(
    refreshTokenObject,
    `${process.env.NEXTAUTH_SECRET}`,
    {
      expiresIn: "1m",
    }
  );
  res
    .status(200)
    .json({ success: true, message: "Password updated", refreshToken });
}

export default handler;
