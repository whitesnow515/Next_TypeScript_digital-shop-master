import { NextApiRequest, NextApiResponse } from "next";

import { getPendingOrderModel } from "@models/order";
import { getCurrentUser } from "@util/AuthUtils";
import { log } from "@util/log";
import { coinbase } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    if (!user && !allowGuest) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }
    const userId = user?._id?.toString();
    try {
      const { orderId } = req.body;
      const PendingOrderModel = await getPendingOrderModel();
      const order = await PendingOrderModel.findById(orderId).exec();
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
      if (order.user && order.user.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: "You are not the owner of this order",
        });
        return;
      }
      if (order.paymentMethod !== coinbase.name) {
        res.status(400).json({
          success: false,
          message: "Order not created with Coinbase",
        });
        return;
      }
      // check stock availability
      const stockManager = await getStockManager();
      const orderData = order.subOrders[0];
      const quantity = orderData.productQuantity;
      const productId = orderData.product.toString();
      const optionId = orderData.productOptionId.toString();
      const stock = await getStockManager().getStockAmount(
        productId,
        optionId,
        false
      );
      if (stock < quantity) {
        res.status(400).json({
          success: false,
          message: "Not enough stock",
        });
        return;
      }
      // cancel the current charge on coinbase
      const cb = order.metadata.coinbase;
      try {
        await coinbase.cancelPayment(cb?.id || order.shortId);
      } catch (e) {
        /* empty */
      } // ignore errors
      // create a new charge on coinbase
      const url = await coinbase.createPayment(order, user);
      res.status(200).json({ success: true, url });
    } catch (err) {
      log(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default withRateLimit(handler, 1, 10);
