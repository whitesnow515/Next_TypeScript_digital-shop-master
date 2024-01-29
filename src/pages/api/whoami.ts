import { NextApiRequest, NextApiResponse } from "next";

import { getCurrentUser } from "@util/AuthUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getCurrentUser(req, res);
  if (!user) {
    res.status(200).json({ success: false, message: "Not Logged In" });
    return;
  }
  res.status(200).json({
    success: true,
    username: user.username,
    email: user.email,
    roles: user.roles,
  });
}
