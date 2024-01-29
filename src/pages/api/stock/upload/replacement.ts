import { MessageBuilder } from "discord-webhook-node";
import { Types } from "mongoose";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { AddReplacementLog } from "@app-types/audit/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getAwaitingVerificationModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import sendWebhook from "@util/discord";
import { log, error as errorLog, debug } from "@util/log";
import { supportRoles } from "@util/Roles";
import { getBaseUrl, getIp, requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";
import {sendMessage} from "@lib/telegram";

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, supportRoles, true);
      if (!token) {
        return;
      }
      const { pull, amount } = req.query;
      const { data, orderId, subOrderId, reason } = req.body;
      if (pull !== "true" && (!data || !Array.isArray(data))) {
        res.status(400).json({ error: true, message: "Invalid data" });
        return;
      }
      if (!orderId) {
        log("No orderId");
        res.status(400).json({ error: true, message: "No orderId" });
        return;
      }
      if (!reason) {
        log("No reason");
        res.status(400).json({ error: true, message: "No reason" });
        return;
      }
      const OrderModel = await getOrderModel();
      let order = await OrderModel.findById(orderId as string);
      if (!order) {
        const AwaitingVerificationOrderModel =
          await getAwaitingVerificationModel();
        order = await AwaitingVerificationOrderModel.findById(
          orderId as string
        );
        if (!order) {
          res.status(400).json({ error: true, message: "Invalid orderId" });
          return;
        }
      }
      const orderData = order.subOrders.find((x:any) => x._id.toString() ===subOrderId);
      if (amount) {
        // check if amount is valid num
        const amountNum = parseInt(amount as string, 10);
        if (Number.isNaN(amountNum)) {
          res.status(400).json({ error: true, message: "Invalid amount" });
          return;
        }
        if (amountNum > orderData.stockLines) {
          res.status(400).json({
            error: true,
            message: "Pull amt > lines ordered.",
          });
          return;
        }
      }
      const ProductModel = await getOrderModel();
      let product = await ProductModel.findById(orderData.product.toString() as string);
    
      try {
        const id = await getStockManager().saveReplacement(
          data,
          orderId as string,
          order.user?.toString() ?? null,
          {
            // product id and option id
            id: orderData.product.toString(),
            option: orderData.productOptionId.toString(),
            pull: false,
            subOrderId: subOrderId,
            pullAmount: amount ? parseInt(amount as string, 10) : undefined,
          }
        );
        debug(`ID: ${id}`);
        if (id) {
          const auditData: AddReplacementLog = {
            type: "add_replacement",
            replacementId: new Types.ObjectId(id),
            orderId: new Types.ObjectId(orderId as string),
            reason,
          };
          await saveAuditLog(auditData, "order", {
            id: token.user?._id?.toString(),
            displayName: token.user?.username,
            ip: getIp(req),
          });
          const url = getBaseUrl({
            removeTrailingSlash: true,
          });
          await getStockManager().getSomeStock(
            orderData.product.toString(),
            orderData.productOptionId.toString(),
            orderData.stockLines, // quantity * lines,
            {
              user: order.user?.toString() ?? null,
              orderId: order._id?.toString() ?? "UNKNOWN",
              updateStock: true,
              replacement: false,
            },
            {
              checkValidity:
                  product?.stockCheckerConfig?.enabled &&
                  product.stockCheckerConfig?.enableAutoCheck,
            }
        );
           sendMessage(`Replacement granted for ${order._id.toString()} - [${orderData.productQuantity}x ${
              orderData.productName
          }, Lines = ${amount ?amount.toString() : `${data.length} manual`}] ${url}/admin/orders/${order._id.toString()}/`, 'audits')

          // await sendWebhook(
          //   "Replacement",
          //   "auditWebhookUrl",
          //   new MessageBuilder()
          //     .setTitle("Replacement Granted")
          //     .addField(
          //       "Order",
          //       `[${orderData.productQuantity}x ${
          //         orderData.productName
          //       }](${url}/admin/orders/${order._id.toString()}/)`
          //     )
          //     .addField(
          //       "Lines",
          //       amount
          //         ? amount.toString()
          //         : `${data.length} (manual)`,
          //       true
          //     )
          //     .addField(
          //       "Granted By",
          //       `[${
          //         token.user.username
          //       }](${url}/admin/users/${token.user._id.toString()}/)`,
          //       true
          //     )
          //     .addField(
          //       "Granted To",
          //       order.user
          //         ? `[${
          //             order.username
          //           }](${url}/admin/users/${order.user.toString()}/)`
          //         : "Guest",
          //       true
          //     )
          //     .addField(
          //       "Reason",
          //       reason
          //         .replace("[", "\\[")
          //         .replace("(", "\\(")
          //         .replace("]", "\\]")
          //         .replace("(", "\\("),
          //       false
          //     )
          // );
        }
      } catch (e: any) {
        errorLog("error", e);
        res.status(500).json({ error: true, message: e.toString() });
        return;
      }
      res.status(200).json({ success: true, message: "Saved!" });
    } catch (error) {
      errorLog("error", error);
      res.status(500).json({ error: true, message: error, success: false });
    }
  }
};
export default handler;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};
