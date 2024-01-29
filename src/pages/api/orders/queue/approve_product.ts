import { render } from "@react-email/render";
import { NextApiRequest, NextApiResponse } from "next";

import { GenericOrderLog } from "@app-types/audit/order";
import { OrderInterface } from "@app-types/models/order";
import OrderVerifiedEmail from "@emails/OrderVerifiedEmail";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getAwaitingVerificationModel } from "@models/order";
import { AppConfig } from "@util/AppConfig";
import requireLoggedIn from "@util/AuthUtils";
import getEmailSender from "@util/email/EmailManager";
import { completeOrderWithObj } from "@util/orders";
import { supportRoles } from "@util/Roles";
import { getBaseUrl, getIp, requireMethod } from "@util/ServerUtils";

async function sendEmails(finalOrder: any) {
  const { email } = finalOrder;
  if (email) {
    const link = `${getBaseUrl()}/orders/${finalOrder._id.toString()}/`;
    const orderData = finalOrder.subOrders[0];
    const username = finalOrder.username ? finalOrder.username : "Guest";
    const htmlEmail = OrderVerifiedEmail({
      username,
      downloadLink: link,
      title: AppConfig.title,
      productName: orderData.productName,
      quantity: orderData.productQuantity,
    });
    const html = render(htmlEmail);
    await getEmailSender().sendEmail(
      email,
      "Your order has been verified",
      html,
      `Your order of ${finalOrder.productQuantity}x ${finalOrder.productName} has been verified!`
    );
  }
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    const { orderId,productId } = req.body;
    if (!orderId) {
      res.status(404).json({ success: false, message: "ID not set" });
      return;
    }
    
    
    const AwaitingModel = await getAwaitingVerificationModel();
    const OrderModel = await getOrderModel();
    let orderData=await OrderModel.findById(orderId)
    let data = await AwaitingModel.findById(orderId);
    if (!data && !orderData) {
      res.status(404).json({ success: false, message: "ID not found" });
      return;
    }
    
   
   
    const awaitingVerificationProducts = orderData.subOrders.filter((item:any) => item.status === "awaiting-verification");
   if(awaitingVerificationProducts.length===1){
    orderData.subOrders.forEach((item:any) => {
       item.status="completed"
     });
     await OrderModel.updateOne({
      _id: orderId
  }, {status: "completed",warrantyStartTimestamp:new Date()})
     orderData.save()
     if(data){
      await data.delete();
    }
   }else{
      const product= orderData.subOrders.find((item:any) =>
        item.product.toString()===productId.toString()
      );
     
      product.status="completed"
      orderData.save()
      if(data){
        const awaitingProducts= data.subOrders.find((item:any) =>
        item.product.toString()===productId.toString()
      );
        awaitingProducts.status="completed"
        await data.save();
      }
   }
    const auditLog: GenericOrderLog = {
      type: "approve",
      orderId: orderData._id,
    };
    await saveAuditLog(auditLog, "order", {
      id: token.user._id.toString(),
      ip: getIp(req),
      displayName: token.user.username,
    });
    try {
      await sendEmails(orderData);
    } catch (e) {
      res.status(200).json({
        success: true,
        message: "Order approved but emails failed to send",
      });
      return;
    }
    res.status(200).json({ success: true, message: "Order approved" });
  }
}
