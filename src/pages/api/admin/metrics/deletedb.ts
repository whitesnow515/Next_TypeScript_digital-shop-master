import { NextApiRequest, NextApiResponse } from "next";

import getMetricsModel from "@models/metrics";
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
      const MetricsModel = await getMetricsModel(); // time-series data
      // not dropping the collection, just deleting all documents because mongoose doesn't support creating time series collections
      await MetricsModel.deleteMany({});
      res.status(200).json({
        success: true,
        message: "Metrics collection cleared.",
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
