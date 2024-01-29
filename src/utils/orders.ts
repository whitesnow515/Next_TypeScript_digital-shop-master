import { render } from "@react-email/render";
import { ObjectId } from "bson";
import { MessageBuilder } from "discord-webhook-node";
import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { SetStatusLog } from "@app-types/audit/order";
import { UserBalUpdateLog } from "@app-types/audit/user";
import {
  cashAppPaidMetricName,
  coinbasePaidMetricName,
  OrdersPaidMetric,
  ordersPaidMetricName,
  PaymentProviderOrderPaidMetric,
} from "@app-types/metrics/SalesMetrics";
import { OrderInterface, OrderStatus } from "@app-types/models/order";
import { ProductOption } from "@app-types/models/product";
import { PaymentProviderNames } from "@app-types/payment/providers";
import DeliveryEmail from "@emails/DeliveryEmail";
import { saveAuditLog } from "@models/audit";
import getFlaggedEmailModel from "@models/flaggedemails";
import { saveMetric } from "@models/metrics";
import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import getProductModel from "@models/product";
import getUserModel from "@models/user";
import { AppConfig } from "@util/AppConfig";
import requireLoggedIn from "@util/AuthUtils";
import sendWebhook, { sendOrderModified } from "@util/discord";
import getEmailSender from "@util/email/EmailManager";
import { error, info } from "@util/log";
import {
  deleteRedisKeysWithPattern,
  getBaseUrl,
  getIp,
} from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";
import {sendMessage} from "@lib/telegram";

export type OrderCompletionResult = {
  data: any;
  heldForVerification: boolean;
  outOfStock: boolean;
};


export async function completeOrderWithObj(
  pendingOrder: any,
  userOrEmail: { user?: any; email?: string } = {},
  allowHold: boolean = true,
  req: NextApiRequest | null = null
): Promise<OrderCompletionResult | null> {
  console.info(":SFAAafsafsFSAFSAFSAFS")

  const UserModel = await getUserModel();

  if (!pendingOrder) {

    return null;
  }
  const orderData = pendingOrder.subOrders[0];
  const ProductModel = await getProductModel();
  const product = await ProductModel.findById(orderData.product);
  let stock;
  let outOfStock = false;

  try {

    stock = await getStockManager().getSomeStock(
      orderData.product.toString(),
      orderData.productOptionId.toString(),
      orderData.stockLines, // quantity * lines,
      {
        user: pendingOrder.user?.toString() ?? null,
        orderId: pendingOrder._id?.toString() ?? "UNKNOWN",
        updateStock: true,
        replacement: false,
      },
      {
        checkValidity:
          product?.stockCheckerConfig?.enabled &&
          product.stockCheckerConfig?.enableAutoCheck,
      }
    );
  } catch (e) {
    info("Failed to get stock", e);
    pendingOrder.status = "out-of-stock" as OrderStatus;
    try {
      let usermodel = await getUserModel()

      await usermodel.updateOne({
        _id: pendingOrder.user,
      }, {
        $inc: {balance: orderData.productQuantity *orderData.productPrice}
      })
      orderData.status = "refunded" as any;
    } catch (e) {
      console.log('failed to refund')
    }
    outOfStock = true;
  }
  info("-----------------------");
  info("STOCK:");
  info(stock);
  info("-----------------------");
  if (stock && stock.dataId) {
    pendingOrder.subOrders[0].stocks = [
      {
        id: new ObjectId(stock.dataId),
        replacement: false,
      },
    ];
  }
  pendingOrder.paid = true;

  if (stock?.appendNote) {
    // append note to order
    pendingOrder.notes = `${
      pendingOrder.notes ? `${pendingOrder.notes}\n` : ""
    }${stock.appendNote}`.trim();
  }

  const newOrder: OrderInterface = {
    ...pendingOrder,
  };
  // check if we need to hold this order for verification
  const option = product.options.find(
    (o: ProductOption) =>
      o._id?.toString() === orderData.productOptionId.toString()
  );
  if (!option) {
    return null;
  }

  product.timesBought += orderData.productQuantity;
  option.timesBought += orderData.productQuantity;
  await product.save();

  const FlaggedModel = await getFlaggedEmailModel();
  let emailFlagged;
  if (!product.holdAllOrders && !option?.holdAllOrders) {
    emailFlagged = await FlaggedModel.findOne({
      email: pendingOrder.email.toLowerCase(),
    }); // idk save a miniscule amount of time
  }
  const isAwaitingAccept =
    pendingOrder?.metadata?.awaitingAccept && pendingOrder.status === "pending";
  let finalOrder;
  const hold =
    stock?.sendToApprovalQueue ||
    (allowHold &&
      // !isAwaitingAccept &&
      !outOfStock && // don't hold out of stock orders, directly move to orders db and have them contact support;
      (product.holdAllOrders || option?.holdAllOrders || emailFlagged));

  const verified = userOrEmail.user && userOrEmail.user.verified;
  const OrderModel = await getOrderModel();
  if (hold && (!userOrEmail.user || !verified)) {
    const AwaitOrderModel = await getAwaitingVerificationModel();
    newOrder.status = "awaiting-verification";
    if (isAwaitingAccept) {
      newOrder.metadata.awaitingAccept = false;
    }
    finalOrder = new AwaitOrderModel(newOrder);
    await finalOrder.save();
    await OrderModel.deleteOne({
      _id: new ObjectId(pendingOrder._id),
    });

    sendMessage(`Order ${pendingOrder._id}  [IP = ${pendingOrder.ip}, Email = ${pendingOrder.email}, Product: ${product.name} - ${option.name}, Quantity & Total paid: ${orderData.productQuantity.toString()} - $${pendingOrder.totalPrice}] is waiting for verification`, 'sales')
    //
    // await sendWebhook(
    //   "Orders",
    //   "orderVerificationWebhookUrl",
    //   new MessageBuilder()
    //     .setTitle("New Order Awaiting Verification")
    //     .setText("@everyone")
    //     .addField("Order ID", pendingOrder._id.toString(), true)
    //     .addField("Email", pendingOrder.email, true)
    //     .addField("Username", pendingOrder.username || "Guest", true)
    //     .addField("Flagged", emailFlagged ? "Yes" : "No", true)
    //     .addField("Product", product.name, true)
    //     .addField("Option", option.name, true)
    //     .addField("Quantity", orderData.productQuantity.toString(), true)
    //     .addField("Total", `$${pendingOrder.totalPrice}`, true)
    //     .addField("Payment Method", pendingOrder.paymentMethod, true)
    //     .addField("IP", pendingOrder.ip, true)
    //     .addField("User ID", pendingOrder.user?.toString() ?? "GUEST", true)
    //     .addField(
    //       "View Info",
    //       `[Click Here](${getBaseUrl()}/admin/orders/${finalOrder._id})`,
    //       false
    //     )
    //     .setTimestamp()
    // );
  } else {
    if (!outOfStock) {
      newOrder.status = "completed";
      newOrder.warrantyStartTimestamp = new Date();
    }
    if (isAwaitingAccept) {
      newOrder.metadata.awaitingAccept = false;
    }
    finalOrder = new OrderModel(newOrder);
    // await finalOrder.save();
    // upsert
    await OrderModel.create(newOrder);
    // await OrderModel.updateOne(
    //   {
    //     _id: finalOrder._id,
    //   },
    //   finalOrder,
    //   {
    //     upsert: true,
    //   }
    // );

  }
  try {
    const PendingOrderModel = await getPendingOrderModel();
    await PendingOrderModel.deleteOne({
      _id: new ObjectId(pendingOrder._id),
    });
  } catch (e) {
    error("Failed to delete pending order", e);
  }
  let email =
    userOrEmail.email ?? userOrEmail.user?.email ?? pendingOrder.email ?? null;
  let user;
  if (finalOrder.user) {
    const UserModel = await getUserModel();
    user = await UserModel.findById(finalOrder.user.toString());
    if (user && !email) {
      email = user.email;
    }
  }
  try {
    if (email && !outOfStock) {
      const link = `${getBaseUrl()}/orders/${finalOrder._id.toString()}/`;
      const username = userOrEmail.user ? userOrEmail.user.username : "Guest";
      const htmlEmail = DeliveryEmail({
        username,
        downloadLink: link,
        productName: orderData.productName,
        title: AppConfig.title,
      });
      const html = render(htmlEmail);
      await getEmailSender().sendEmail(
        email,
        "Thank you for your purchase",
        html,
        `Thank you for your purchase of ${orderData.productQuantity}x ${orderData.productName}!`
      );
    }
    // debug({ user, spent: finalOrder.userBalanceSpent });
    if (user && finalOrder.userBalanceSpent > 0) {
      const auditLog: UserBalUpdateLog = {
        type: "user_change",
        orderId: finalOrder._id,
        userId: finalOrder.user,
        change: "subtract",
        reason: "Order",
        amount: finalOrder.userBalanceSpent,
        before: user.balance + finalOrder.userBalanceSpent,
        after: user.balance,
      };
      await deleteRedisKeysWithPattern("audit-user-*");
      await saveAuditLog(auditLog, "user", {
        id: user._id.toString(),
        ip: req ? getIp(req) : "N/A",
        displayName: user.username || user.email || "N/A",
      });
    }
  } catch (e) {
    error("Failed to send email!");
  }
  return {
    data: finalOrder,
    heldForVerification: hold,
    outOfStock,
  };
}


export async function completeOrderWithObjATC(
    pendingOrder: any,
    userOrEmail: { user?: any; email?: string } = {},
    allowHold: boolean = true,
    req: NextApiRequest
): Promise<any> {
  if (!pendingOrder) {
    return null;
  }
  let usermodel = await getUserModel()
  var outOfStock = false;

  for (var orderData of pendingOrder.subOrders) {
    let subOrderIDX =pendingOrder.subOrders.findIndex((x:any )=> x._id ===orderData._id)
    const ProductModel = await getProductModel();
    const product = await ProductModel.findById(orderData.product);
    let stock;
    try {
      stock = await getStockManager().getSomeStock(
          orderData.product.toString(),
          orderData.productOptionId.toString(),
          orderData.stockLines, // quantity * lines,
          {
            user: pendingOrder.user?.toString() ?? null,
            orderId: pendingOrder._id?.toString() ?? "UNKNOWN",
            updateStock: true,
            replacement: false,
          },
          {
            checkValidity:
                product?.stockCheckerConfig?.enabled &&
                product.stockCheckerConfig?.enableAutoCheck,
          }
      );
    } catch (e) {
      info("Failed to get stock", e);
      orderData.status = "out-of-stock" as OrderStatus;

      try {
        await usermodel.updateOne({
          _id: pendingOrder.user,
        }, {
         $inc: {balance: orderData.productQuantity *orderData.productPrice}
        })
        orderData.status = "refunded" as any;

      } catch (e){
        orderData.status = "refund-failed" as any;

      }

      outOfStock = true;
    }
    info("-----------------------");
    info("STOCK:");
    info(stock);
    info("-----------------------");
    if (stock && stock.dataId) {
      pendingOrder.subOrders[subOrderIDX].stocks = [
        {
          id: new ObjectId(stock.dataId),
          replacement: false,
        },
      ];
    }
    if (stock?.appendNote) {
      // append note to order
      pendingOrder.notes = `${
          pendingOrder.notes ? `${pendingOrder.notes}\n` : ""
      }${stock.appendNote}`.trim();
    }

    pendingOrder.paid = true;

    const option = product.options.find(
        (o: ProductOption) =>
            o._id?.toString() === orderData.productOptionId.toString()
    );
    if (!option) {
      return null;
    }


    product.timesBought += orderData.productQuantity;
    option.timesBought += orderData.productQuantity;
    await product.save();

    const FlaggedModel = await getFlaggedEmailModel();
    let emailFlagged;
    if (!product.holdAllOrders && !option?.holdAllOrders) {
      emailFlagged = await FlaggedModel.findOne({
        email: pendingOrder.email.toLowerCase(),
      }); // idk save a miniscule amount of time
    }

    const hold =
        stock?.sendToApprovalQueue ||
        (allowHold &&
            !outOfStock && // don't hold out of stock orders, directly move to orders db and have them contact support;
            (product.holdAllOrders || option?.holdAllOrders || emailFlagged));
            // !isAwaitingAccept

    const verified = userOrEmail.user && userOrEmail.user.verified;
    const OrderModel = await getOrderModel();
    
    const isAwaitingAccept =
        pendingOrder?.metadata?.awaitingAccept && pendingOrder.status === "pending";
        
    if (hold && (!userOrEmail.user || !verified)) { 
      const AwaitOrderModel = await getAwaitingVerificationModel();
      pendingOrder.status = "awaiting-verification";
      orderData.status="awaiting-verification"
      // const awaitingOrder: OrderInterface = {
      //   ...pendingOrder.toObject(),
      // };
      if (isAwaitingAccept) {
        orderData.metadata.awaitingAccept = false;
      }
      // await AwaitOrderModel.create({email: pendingOrder.email.toString(), timestamp: pendingOrder.timestamp,...awaitingOrder});

      // sendMessage(`Order ${pendingOrder._id}  [IP = ${pendingOrder.ip}, Email = ${pendingOrder.email}, Product: ${product.name} - ${option.name}, Quantity & Total paid: ${orderData.productQuantity.toString()} - $${pendingOrder.totalPrice}] is waiting for verification`, 'sales')
     
      //
      // await sendWebhook(
      //     "Orders",
      //     "orderVerificationWebhookUrl",
      //     new MessageBuilder()
      //         .setTitle("New Order Awaiting Verification")
      //         .setText("@everyone")
      //         .addField("Order ID", pendingOrder._id.toString(), true)
      //         .addField("Email", pendingOrder.email, true)
      //         .addField("Username", pendingOrder.username || "Guest", true)
      //         .addField("Flagged", emailFlagged ? "Yes" : "No", true)
      //         .addField("Product", product.name, true)
      //         .addField("Option", option.name, true)
      //         .addField("Quantity", orderData.productQuantity.toString(), true)
      //         .addField("Total", `$${pendingOrder.totalPrice}`, true)
      //         .addField("Payment Method", pendingOrder.paymentMethod, true)
      //         .addField("IP", pendingOrder.ip, true)
      //         .addField("User ID", pendingOrder.user?.toString() ?? "GUEST", true)
      //         .addField(
      //             "View Info",
      //             `[Click Here](${getBaseUrl()}/admin/orders/${pendingOrder._id})`,
      //             false
      //         )
      //         .setTimestamp()
      // );
    } else {
      if (!outOfStock) {
        pendingOrder.status = "completed";
        pendingOrder.warrantyStartTimestamp = new Date();
        orderData.status ="completed"
      }

      if (isAwaitingAccept) {
        pendingOrder.metadata.awaitingAccept = false;
      }

    }
    try {
      const PendingOrderModel = await getPendingOrderModel();
      await PendingOrderModel.deleteOne({
        _id: new ObjectId(pendingOrder._id),
      });
    } catch (e) {
      error("Failed to delete pending order", e);
    }
    let email =
        userOrEmail.email ?? userOrEmail.user?.email ?? pendingOrder.email ?? null;
    let user:any;

    try {
      if (email && !outOfStock) {
        const link = `${getBaseUrl()}/orders/${pendingOrder._id.toString()}/`;
        const username = userOrEmail.user ? userOrEmail.user.username : "Guest";
        const htmlEmail = DeliveryEmail({
          username,
          downloadLink: link,
          productName: orderData.productName,
          title: AppConfig.title,
        });
        const html = render(htmlEmail);
        await getEmailSender().sendEmail(
            email,
            "Thank you for your purchase",
            html,
            `Thank you for your purchase of ${orderData.productQuantity}x ${orderData.productName}!`
        ).catch(err => {
          console.log("Email could not be sent")
        });
      }
      // debug({ user, spent: finalOrder.userBalanceSpent });
      if (user && pendingOrder.userBalanceSpent > 0) {
        const auditLog: UserBalUpdateLog = {
          type: "user_change",
          orderId: pendingOrder._id,
          userId: pendingOrder.user,
          change: "subtract",
          reason: "Order",
          amount: pendingOrder.userBalanceSpent,
          before: user.balance + pendingOrder.userBalanceSpent,
          after: user.balance,
        };
        await deleteRedisKeysWithPattern("audit-user-*");
        await saveAuditLog(auditLog, "user", {
          id: user._id.toString(),
          ip: req ? getIp(req) : "N/A",
          displayName: user.username || user.email || "N/A",
        });
      }
    } catch (e) {
      error("Failed to send email!");
    }

  }

  const newOrder: OrderInterface = {
    ...pendingOrder.toObject(),
  };
  const AwaitOrderModel = await getAwaitingVerificationModel();

  const OrderModel = await getOrderModel();


  await OrderModel.deleteOne({
    _id: new ObjectId(pendingOrder._id),
  })
  {/* @ts-ignore */}
  const finalOrder =await (pendingOrder.status==="awaiting-verification"? AwaitOrderModel: OrderModel).create({email: pendingOrder.email.toString(), timestamp: pendingOrder.timestamp,...newOrder});
  await OrderModel.updateOne(
      {
        _id: finalOrder._id,
      },
      finalOrder,
      {
        upsert: true,

      }
  );

  const metric = {
    orderId: pendingOrder._id,
    userId: pendingOrder.user,
    price: pendingOrder.totalPrice,
    guest: !pendingOrder.user,
  } as OrdersPaidMetric;

  if (pendingOrder.paymentMethod !== "Balance") {
    await saveMetric(
      {
        ...metric,
        provider: pendingOrder.paymentMethod,
      } as PaymentProviderOrderPaidMetric,
      cashAppPaidMetricName
    );
  }

   
 
  let orderFinalData=pendingOrder.subOrders.find((data:any) => data)
   
  await saveMetric(
    {
      ...metric,
      provider: pendingOrder.paymentMethod,
    } as PaymentProviderOrderPaidMetric,
    ordersPaidMetricName
  );
 
  if(orderFinalData.status==="awaiting-verification"){
    sendMessage(
      `Order #${pendingOrder._id} placed and is in waiting for verification
      - IP: ${pendingOrder.ip},
      - Email: ${pendingOrder.email},
      - Product: ${orderFinalData.productName} - ${orderFinalData.productOption}.
      - Quantity: ${orderData.productQuantity.toString()}
      - Total paid: $${parseFloat(pendingOrder.totalPrice).toFixed(2)}
      `, 'sales'
    );
  }else{
    sendMessage(
      `Order #${pendingOrder._id} is placed.
      - IP: ${pendingOrder.ip},
      - Email: ${pendingOrder.email},
      - Product: ${orderFinalData.productName} - ${orderFinalData.productOption}.
      - Quantity: ${orderData.productQuantity.toString()}
      - Total paid: $${parseFloat(pendingOrder.totalPrice).toFixed(2)}
      `, 'sales'
    );
  }
  try {
    const PendingOrderModel = await getPendingOrderModel();
    await PendingOrderModel.deleteOne({
      _id: new ObjectId(pendingOrder._id),
    });
  } catch (e) {
    error("Failed to delete pending order", e);
  }
  return finalOrder;
}

export async function setOrderAsAwaitingAccept(
  pendingOrder: any
): Promise<{ data: any } | null> {
  if (!pendingOrder) {
    return null;
  }
  const orderData = pendingOrder.subOrders[0];
  pendingOrder.paid = true;
  const newOrder: OrderInterface = {
    ...pendingOrder.toObject(),
  };
  const ProductModel = await getProductModel();
  const product = await ProductModel.findById(orderData.product);
  const option = product.options.find(
    (o: ProductOption) =>
      o._id?.toString() === orderData.productOptionId.toString()
  );
  if (!option) {
    return null;
  }
  const OrderModel = await getOrderModel();
  newOrder.status = "pending";
  newOrder.metadata = {
    ...newOrder.metadata,
    awaitingAccept: true,
  };
  const finalOrder = new OrderModel(newOrder);
  await finalOrder.save();
  const PendingOrderModel = await getPendingOrderModel();
  await PendingOrderModel.deleteOne({
    _id: new ObjectId(pendingOrder._id),
  });
  return {
    data: finalOrder,
  };
}

export async function completeOrder(
  orderId: string,
  userOrEmail: { user?: any; email?: string } = {},
  allowHold: boolean = true, req: any
) {
  let usermodel = await getUserModel()

  const PendingOrderModel = await getPendingOrderModel();
  let pendingOrder = await PendingOrderModel.findById(orderId).lean().exec();
  if (!pendingOrder) {
    const OrderModel = await getOrderModel();
    pendingOrder = await OrderModel.findById(orderId).lean().exec();
    if (!pendingOrder) return null;
  }

  return pendingOrder.subOrders.length === 1 ? completeOrderWithObj(pendingOrder, userOrEmail, allowHold) : completeOrderWithObjATC(pendingOrder, userOrEmail, allowHold, req);
}

export async function setPaid(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await requireLoggedIn(req, res, ["support"], true);
    if (!token) {
      return;
    }
    const { id, reason } = req.body;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "No ID provided",
      });
      return;
    }
    /*
    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Missing reason",
      });
      return;
    }
     */

    var order = await completeOrder(
      id as string,
      undefined, // undefined as it will query user db
      true, req
    );
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Something went wrong completing that order!",
      });
      return;
    }
    if (!order.data) {
      order = {data: order}
    }
    const auditLog: SetStatusLog = {
      orderId: new Types.ObjectId(id),
      type: "set_status",
      status: "completed",
      reason: (reason as string) || "No reason provided.",
      stockAdded: !order.outOfStock,
    };
    const performerId = token.user?._id?.toString();
    await saveAuditLog(auditLog, "order", {
      id: performerId,
      displayName: token.user?.username,
      ip: getIp(req),
    });
    const metric = {
      orderId: order.data._id,
      userId: order.data.user,
      price: order.data.totalPrice,
      guest: !order.data.user,
    } as OrdersPaidMetric;
    await saveMetric(metric, ordersPaidMetricName);
    await sendOrderModified(
      "Order Marked as Paid",
      null,
      null,
        order.data,
      token
    );
    const paymentMethod = order.data.paymentMethod as PaymentProviderNames;
    if (paymentMethod === "CashApp") {
      await saveMetric(
        {
          ...metric,
          provider: "CashApp",
        } as PaymentProviderOrderPaidMetric,
        cashAppPaidMetricName
      );
    } else if (paymentMethod === "Coinbase") {
      await saveMetric(
        {
          ...metric,
          provider: "Coinbase",
        } as PaymentProviderOrderPaidMetric,
        coinbasePaidMetricName
      );
    }
    res.status(200).json({
      success: true,
      message: "Order marked as paid",
    });
  } catch (e) {
    error(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}
