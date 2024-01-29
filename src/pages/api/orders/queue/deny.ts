import { NextApiRequest, NextApiResponse } from "next";

import { GenericOrderLog } from "@app-types/audit/order";
import { OrderInterface, StockInfoInterface } from "@app-types/models/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getAwaitingVerificationModel } from "@models/order";
import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { supportRoles } from "@util/Roles";
import { getIp, requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";

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
    const data = await AwaitingModel.findById(id);
    if (!data) {
      res.status(500).json({ success: false, message: "ID not found" });
      return;
    }
    const { stocks } = data.subOrders[0];
    /*
    const stocksStr: string[] = stocks.map((stock: StockInfoInterface) =>
      stock.id?.toString()
    );
     */
    // get a string array of stock ids, unless the stock is a replacement
    const stocksStr: string[] = stocks
      .filter((stock: StockInfoInterface) => !stock.replacement)
      .map((stock: StockInfoInterface) => stock.id?.toString());
    await getStockManager().markStocksUnused(stocksStr);
    const replacementIds: string[] = stocks
      .filter((stock: StockInfoInterface) => stock.replacement)
      .map((stock: StockInfoInterface) => stock.id?.toString());
    await getStockManager().removeReplacements(replacementIds);
    const OrderModel = await getOrderModel();
    const newOrder: OrderInterface = {
      ...data.toObject(),
    };
    newOrder.status = "cancelled";
    if (newOrder.subOrders && newOrder.subOrders[0])
      newOrder.subOrders[0].stocks = [];
    if (!newOrder.metadata) {
      newOrder.metadata = {};
    }
    newOrder.metadata.denied = true;
    const finalOrder = new OrderModel(newOrder);
    await finalOrder.save();
    await data.delete();
    const { userBalanceSpent } = finalOrder;
    if (userBalanceSpent) {
      const { user } = finalOrder; // ObjectId
      const UserModel = await getUserModel();
      // add the balance back to the user
      await UserModel.findByIdAndUpdate(user, {
        $inc: { balance: userBalanceSpent },
      });
    }
    const auditLog: GenericOrderLog = {
      type: "deny",
      orderId: finalOrder._id,
    };
    await saveAuditLog(auditLog, "order", {
      id: token.user._id.toString(),
      ip: getIp(req),
      displayName: token.user.username,
    });
    /*
    const { email } = finalOrder;
    if (email) {
      const link = `${getBaseUrl()}/orders/${finalOrder._id.toString()}/`;
      const username = finalOrder.username ? finalOrder.username : "Guest";
      const htmlEmail = OrderVerifiedEmail({
        username,
        downloadLink: link,
        title: AppConfig.title,
        productName: finalOrder.productName,
        quantity: finalOrder.productQuantity,
      });
      const html = render(htmlEmail);
      await getEmailSender().sendEmail(
        email,
        "Your order has been verified",
        html,
        `Your order of ${finalOrder.productQuantity}x ${finalOrder.productName} has been verified!`
      );
    }
     */
    res.status(200).json({ success: true, message: "Order denied" });
  }
}
