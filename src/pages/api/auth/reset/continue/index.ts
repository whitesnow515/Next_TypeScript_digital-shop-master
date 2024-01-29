import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import withRateLimit from "@util/RateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { password, token } = req.body;
    const decodedToken = jwt.verify(token, `${process.env.NEXTAUTH_SECRET}`);
    // @ts-ignore - these values exist.
    const { email, id } = decodedToken;
    // Connect with database
    const UserModel = await getUserModel();
    // Check existing
    const user = await UserModel.findOne({
      email,
      _id: id,
    }).exec();
    if (!user) {
      res.status(422).json({
        error: true,
        message: "User not found",
      });
      return;
    }
    const newPass = await hash(password, 12);
    user.password = newPass;
    await user.save();
    res.status(200).json({
      error: false,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } else {
    // Response for other than POST method
    res
      .status(500)
      .json({ error: true, success: false, message: "Invalid Route" });
  }
}

export default withRateLimit(handler, 3, 60);
