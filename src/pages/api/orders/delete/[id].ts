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
      if (typeof id !== "string" || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid ID provided",
        });
        return;
      }
      const objectId = new ObjectId(id as string);
      await getStockManager().removeStockOrder(id as string);
      let order;
      const OrderModel = await getOrderModel();
      const PendingOrderModel = await getPendingOrderModel();
      order = await OrderModel.findOne({ _id: objectId });
      if (order) {
        await OrderModel.deleteOne({
          _id: objectId,
        });
      } else {
        order = await PendingOrderModel.findOne({ _id: objectId });
        if (order) {
          const userBalSpent = order.userBalanceSpent;
          // refund user balance
          const { user } = token;
          user.balance += userBalSpent;
          await user.save();
          await PendingOrderModel.deleteOne({
            _id: objectId,
          });
        }
      }

      if (!order) {
        res.status(400).json({
          success: false,
          message: "No order found with that ID",
        });
      } else {
        const auditData: GenericOrderLog = {
          type: "delete_order",
          orderId: new Types.ObjectId(id as string),
        };
        await saveAuditLog(auditData, "order", {
          id: token.user._id?.toString(),
          displayName: token.user.displayName,
          ip: getIp(req),
        });
        const subOrder = order.subOrders[0];
        await sendOrderModified(
          "Order Deleted",
          "Order Details",
          `${subOrder.productQuantity}x ${subOrder.productName}`,
          order,
          token
        );
        res.status(200).json({
          success: true,
          message: "Successfully deleted order",
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
