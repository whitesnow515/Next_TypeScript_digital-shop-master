import { NextApiRequest, NextApiResponse } from "next";

import {
  coinbasePaidMetricName,
  OrdersPaidMetric,
  ordersPaidMetricName,
  PaymentProviderOrderPaidMetric,
} from "@app-types/metrics/SalesMetrics";
import {
  setWebhookEventTypes,
  WebhookEvent,
} from "@app-types/payment/coinbase";
import { saveMetric } from "@models/metrics";
import { getPendingOrderModel } from "@models/order";
import getUserModel from "@models/user";
import { error, info } from "@util/log";
import { completeOrderWithObj } from "@util/orders";
import { coinbase } from "@util/payments/PaymentProviderHolder";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    if (process.env.LOG_COINBASE_TO_FILE === "true") {
      const data = {
        body: req.body,
        headers: req.headers,
        method: req.method,
        query: req.query,
        url: req.url,
      };
      const fs = await import("fs");
      fs.appendFileSync(
        "./coinbase.log",
        `${JSON.stringify(data, null, 2)}\n\n`,
        "utf-8"
      );
    }
    if ((process.env.COINBASE_TESTING || "false") !== "true") {
      if (!(await coinbase.verifyRequest(req))) {
        res.status(400).json({ success: false, message: "Invalid signature" });
        return;
      }
    }
    info("Coinbase callback");
    // info(req.body);

    const event: WebhookEvent = setWebhookEventTypes(req.body.event);
    if (event.type === "charge:confirmed") {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      // const { order_id } = event.data.metadata as CoinbaseChargeMetadata;
      const PendingOrderModel = await getPendingOrderModel();
      const metadataOrderId = event.data?.metadata?.order_id;
      const chargeId = event.data.id;
      let orderData;
      if (metadataOrderId) {
        orderData = await PendingOrderModel.findById(metadataOrderId);
      }
      if (!orderData && chargeId) {
        orderData = await PendingOrderModel.findOne({
          "metadata.coinbase.id": chargeId,
        }).exec();
      }

      if (!orderData) {
        res.status(400).json({
          success: false,
          message: "Order not found",
        });
        return;
      }
      if (orderData) {
        let user = null;
        if (orderData.user) {
          const UserModel = await getUserModel();
          user = await UserModel.findById(orderData.user);
          if (!user) {
            error("User not found (", orderData.user, ")");
            res.status(400).json({ success: false, message: "User not found" });
            return;
          }
          user.showSupportButton = true;
          await user.save();
        }
        const order = await completeOrderWithObj(
          orderData,
          {
            user,
            email: orderData.email,
          },
          true,
          req
        );
        if (!order) {
          error("Failed to complete order (", orderData._id.toString(), ")");
          res.status(400).json({
            success: false,
            message: "Something went wrong completing that order!",
          });
          return;
        }
        const metric: OrdersPaidMetric = {
          orderId: order.data._id,
          userId: order.data.user,
          price: orderData.totalPrice,
          guest: !order.data.user,
        };
        await saveMetric(metric, ordersPaidMetricName);
        await saveMetric(
          {
            ...metric,
            provider: "Coinbase",
          } as PaymentProviderOrderPaidMetric,
          coinbasePaidMetricName
        );
      }
    }
    res.status(200).json({ success: true });
  }
}

export default handler;
