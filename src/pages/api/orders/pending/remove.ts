import { NextApiRequest, NextApiResponse } from "next";

import { getPendingOrderModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const PendingOrderModel = await getPendingOrderModel();
      await PendingOrderModel.deleteMany({});
      res.status(200).json({
        success: true,
        message: "Pending orders collection cleared.",
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
