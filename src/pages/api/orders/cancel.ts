import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import { getPendingOrderModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { coinbase } from "@util/payments/PaymentProviderHolder";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      const PendingOrderModel = await getPendingOrderModel();
      const order = await PendingOrderModel.findOne({
        _id: objectId,
        user: token.user._id,
      });
      if (!order) {
        res.status(400).json({
          success: false,
          message: "No order found with that ID (1)",
        });
        return;
      }
      if (order.paid || order.status !== "pending") {
        res.status(400).json({
          success: false,
          message: "Cannot delete a paid order",
        });
        return;
      }
      const { userBalanceSpent } = order;
      if (order.paymentMethod === coinbase.name) {
        const cb = order.metadata.coinbase;
        try {
          await coinbase.cancelPayment(cb?.id || order.shortId);
        } catch (e) {
          /* empty */
        } // ignore errors
      }
      const deleteResult = await order.delete();
      if (deleteResult.deletedCount === 0) {
        res.status(400).json({
          success: false,
          message: "No order found with that ID (2)",
        });
      } else {
        if (userBalanceSpent > 0) {
          token.user.balance += userBalanceSpent;
          await token.user.save();
        }
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
