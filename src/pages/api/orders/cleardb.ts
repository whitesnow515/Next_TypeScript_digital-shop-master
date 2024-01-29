import { NextApiRequest, NextApiResponse } from "next";

import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST", "DELETE")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const OrderModel = await getOrderModel();
      // drop the entire collection
      await OrderModel.collection.drop();
      const AwaitingModel = await getAwaitingVerificationModel();
      await AwaitingModel.collection.drop();
      const PendingOrderModel = await getPendingOrderModel();
      await PendingOrderModel.collection.drop();
      // drop usedstocks collection
      await getStockManager().dropUsedStocks();
      res.status(200).json({
        success: true,
        message: "Successfully cleared orders",
      });
    } catch (eX) {
      error(eX);
      res.status(500).json({
        success: false,
        message: eX,
      });
    }
  }
}
