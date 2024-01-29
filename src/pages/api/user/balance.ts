import { NextApiRequest, NextApiResponse } from "next";

import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const token = await requireLoggedIn(req, res, ["user"], true);
      if (!token) {
        return;
      }
      const { balance } = token.user;
      res.status(200).json({
        success: true,
        balance,
      });
    } catch (e) {
      error(e);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
