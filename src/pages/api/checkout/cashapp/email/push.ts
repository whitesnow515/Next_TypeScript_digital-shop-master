import { NextApiRequest, NextApiResponse } from "next";

import {
  cashAppPaidMetricName,
  OrdersPaidMetric,
  ordersPaidMetricName,
  PaymentProviderOrderPaidMetric,
} from "@app-types/metrics/SalesMetrics";
import { saveMetric } from "@models/metrics";
import { getPendingOrderModel } from "@models/order";
import getUserModel from "@models/user";
import { debug } from "@util/log";
import { completeOrderWithObj, setOrderAsAwaitingAccept } from "@util/orders";
import { cashApp } from "@util/payments/PaymentProviderHolder";
import escapeRegExp from "@util/regex";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const { from, sender, subject, secret, html } = req.body;
    let { text } = req.body;
    if (!text && html) text = html;
    const expectedSecret = await getSetting("cashAppEmailSecret", "");
    debug("----------");
    if (!expectedSecret) {
      res.status(500).json({ success: false, message: "Something went wrong" });
      return;
    }
    if (secret !== expectedSecret) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!from || !subject || !text) {
      debug(`CashApp email received: ${subject} (missing fields)`);
      debug(` - from: ${from}`);
      debug(` - subject: ${subject}`);
      debug(` - text: ${text}`);
      res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
      return;
    }
    // match "ABC sent you $1.10 for mounted outage system" in subject
    const match = subject.match(/.* sent you \$(.*) for (.*)/);
    if (!match) {
      debug(`CashApp email received: ${subject} (no match)`);
      res
        .status(400)
        .json({ success: false, message: "Subject does not match" });
      return;
    }
    const amount = parseFloat(match[1]);
    const reason = match[2];
    debug(`CashApp email received: ${reason} - ${amount}`);
    const PendingOrderModel = await getPendingOrderModel();
    const order = await PendingOrderModel.findOne({
      shortId: { $regex: new RegExp(`^${escapeRegExp(reason)}$`, "i") }, // case insensitive
    });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    if (order.paid) {
      res.status(400).json({ success: false, message: "Order already paid" });
    }
    if (order.totalPrice !== amount) {
      res
        .status(400)
        .json({ success: false, message: "Amount does not match" });
      return;
    }
    debug(`text: ${text}`);
    const matchAwaitingAccept = text.match(
      /More information is required to accept this payment/
    );
    const matchSuccess = text.match(
      /(To view your receipt, visit: https:\/\/cash\.app\/payments\/(.*)\/receipt|.* is now available in your Cash App)/
    );
    const awaitingAccept = async () => {
      // await cashApp.finalizePayment(order.shortId || "", amount); // make it so that we don't check again
      await setOrderAsAwaitingAccept(order);
    };
    if (matchAwaitingAccept) {
      debug(" - awaiting accept");
      // requires manual accept
      await awaitingAccept();
      res
        .status(200)
        .json({ success: true, message: "Payment status updated" });
    } else {
      if (!matchSuccess) {
        debug(" - No success match");
        res
          .status(400)
          .json({ success: false, message: "Email does not match" });
        return;
      }
      debug(" - success");
      const cashAppId = matchSuccess[1];
      const cashAppReceiptChecking = await getSetting(
        "cashAppReceiptChecking",
        true
      );
      const result = cashAppReceiptChecking
        ? await cashApp.checkReceipt(cashAppId as string, order, {
            allowProxy: true,
          })
        : { success: true, awaitingAccept: false };
      if (result?.success) {
        // await cashApp.finalizePayment(order.shortId || "", amount);
        const userId = order.user;
        let user = null;
        if (userId) {
          const UserModel = await getUserModel();
          user = await UserModel.findById(userId);
        }
        const finalOrder = await completeOrderWithObj(
          order,
          {
            user,
            email: order.email,
          },
          true,
          req
        );
        const metric: OrdersPaidMetric = {
          orderId: finalOrder?.data._id,
          userId: finalOrder?.data.user,
          price: amount,
          guest: !finalOrder?.data.user,
        };
        await saveMetric(metric, ordersPaidMetricName);
        await saveMetric(
          {
            ...metric,
            provider: "CashApp",
          } as PaymentProviderOrderPaidMetric,
          cashAppPaidMetricName
        );
      } else if (result?.awaitingAccept) {
        await awaitingAccept();
      }
      res
        .status(200)
        .json({ success: true, message: "Payment status updated" });
    }
  }
}
export default handler;
