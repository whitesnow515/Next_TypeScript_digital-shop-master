import { NextApiRequest, NextApiResponse } from "next";

import getFeatured from "@util/common/featured";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const finalData = await getFeatured();
      res.status(200).json({
        success: true,
        data: finalData,
      });
    } catch (err) {
      log(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
