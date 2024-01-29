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
    const { id } = req.body;
    if (!id) {
      res.status(500).json({ success: false, message: "ID not set" });
      return;
    }
    const AwaitingModel = await getAwaitingVerificationModel();
    let data = await AwaitingModel.findById(id);
    if (!data) {
      const OrderModel = await getOrderModel();
      data = await OrderModel.findById(id);
      if (data && data.status === "cancelled") {
        // denied order, reapprove
        await completeOrderWithObj(
          data,
          {
            // email: data.email,
          },
          false,
          req
        );
        const auditLog: GenericOrderLog = {
          type: "approve",
          orderId: data._id,
        };
        await saveAuditLog(auditLog, "order", {
          id: token.user._id.toString(),
          ip: getIp(req),
          displayName: token.user.username,
        });
        try {
          await sendEmails(data);
        } catch (e) {
          res.status(200).json({
            success: true,
            message: "Order approved but emails failed to send",
          });
          return;
        }
        res.status(200).json({ success: true, message: "Order approved" });
        return;
      }
      res.status(500).json({ success: false, message: "ID not found" });
      return;
    }
    const OrderModel = await getOrderModel();
    let orderData=await OrderModel.findById(id)
    orderData.subOrders.forEach((item:any) => {
      item.status="completed"
    });
    await OrderModel.updateOne({
      _id: id
  }, {status: "completed",warrantyStartTimestamp:new Date()})
     orderData.save()
    // const newOrder: OrderInterface = {
    //   ...data.toObject(),
    //   _id: new OrderModel().id, // Generate a new unique _id
    // };

    // newOrder.status = "completed";
    // newOrder.warrantyStartTimestamp = new Date();
    await data.delete();
    // await finalOrder.save();

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
