import { ObjectId } from "bson";
import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { GenericOrderLog } from "@app-types/audit/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { sendOrderModified } from "@util/discord";
import { error } from "@util/log";
import { getIp, requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST", "DELETE")) {
    const token = await requireLoggedIn(req, res, ["user"], true);
    if (!token) {
      return;
    }
    try {
      const { id } = req.query;
      if (!id) {
        res.status(400).json({
          success: false,
          message: "No ID provided",
        });
        return;
      }
      if (typeof id !== "string" || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid ID provided",
        });
        return;
      }
      const objectId = new ObjectId(id as string);
      await getStockManager().removeStockOrder(id as string);
      const PendingOrderModel = await getPendingOrderModel();
      if (objectId) {
        await PendingOrderModel.deleteOne({
          _id: objectId,
        });
        res.status(200).json({
          success: true,
          message: "Order deleted successfully",
        });
      } 
    } catch (e) {
      error(e);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
