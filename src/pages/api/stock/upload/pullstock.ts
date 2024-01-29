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


function getRandomElements(arr:any, count:number) {
  const shuffled = arr.slice(0);
  let i = arr.length;
  const min = i - count;
  let temp;
  let index;

  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }

  return shuffled.slice(min);
}

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
    //   const { pull, amount } = req.query;
      const { data, orderId, subOrderId, reason, productId, optionId, amount } = req.body;
       
      if (!orderId) {
        log("No orderId");
        res.status(400).json({ error: true, message: "No orderId" });
        return;
      }
      
      const OrderModel = await getOrderModel();
      let order = await OrderModel.findById(orderId as string);
      
      if (!orderId) {
        log("No orderId");
        res.status(400).json({ error: true, message: "No orderId" });
        return;
      }
      const orderData = order.subOrders.find((x:any) => x._id.toString() === subOrderId);
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
      try {
      const stock = await getStockManager().getStock(productId, optionId) 
      
        const selectedStock = getRandomElements(stock, amount);
        if (stock) {
            res.status(200).json({ success: true, message: "Successfully pulled stock", data: selectedStock });
        }else{
            res.status(400).json({ error: true, message: "Stock not available", success: false });
        }
     
      } catch (e: any) {
        errorLog("error", e);
        res.status(500).json({ error: true, message: e.toString() });
        return;
      }
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
