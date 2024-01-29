import { ObjectId } from "bson";
import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { GenericOrderLog } from "@app-types/audit/order";
import { StockInfoInterface } from "@app-types/models/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import { getUsedStockModel } from "@models/stock";
import requireLoggedIn from "@util/AuthUtils";
import { debug } from "@util/log";
import { getIp, requireMethod } from "@util/ServerUtils";

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
      const { id } = req.query;
      if (!id) {
        res.status(400).json({
          success: false,
          message: "No ID provided",
        });
        return;
      }
      if (req.query.order && !ObjectId.isValid(req.query.order as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid order ID provided",
        });
        return;
      }
      const UsedStockModel = await getUsedStockModel();
      const orderId = req.query.order
        ? new ObjectId(req.query.order as string)
        : null;
      const data = await UsedStockModel.findById(id);
      if (!data) {
        res.status(400).json({
          success: false,
          message: "No stock found",
        });
        return;
      }
      await data.delete();
      const OrderModel = await getOrderModel();
      let order = await OrderModel.findById(orderId);
      if (!order) {
        const PendingOrderModel = await getPendingOrderModel();
        order = await PendingOrderModel.findById(orderId);
        if (!order) {
          const AwaitingOrderModel = await getAwaitingVerificationModel();
          order = await AwaitingOrderModel.findById(orderId);
        }
      }
      debug("order", order, " | ", orderId);
      if (order) {
        const orderData = order.subOrders[0];
        orderData.stocks = orderData.stocks.filter(
          (stock: StockInfoInterface) => {
            debug("stock", stock.id?.toString(), id);
            return stock.id?.toString() !== (id as string);
          }
        );
        order.subOrders[0] = orderData;
        await order.save();
        const auditLog: GenericOrderLog = {
          type: "remove_stock",
          orderId: new Types.ObjectId(req.query.order as string),
        };
        await saveAuditLog(auditLog, "order", {
          id: token.user._id?.toString(),
          displayName: token.user.username,
          ip: getIp(req),
        });
      }
      res.status(200).json({
        success: true,
        message: "Stock deleted",
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}
