import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import {
  cashAppPaidMetricName,
  OrdersPaidMetric,
  ordersPaidMetricName,
  PaymentProviderOrderPaidMetric,
} from "@app-types/metrics/SalesMetrics";
import { ProductOption } from "@app-types/models/product";
import { saveMetric } from "@models/metrics";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { completeOrderWithObj, setOrderAsAwaitingAccept } from "@util/orders";
import { cashApp } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { supportRoles, hasRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // queried by the client periodically to check if the payment has been made. If it has, it then posts the finish endpoint.
  if (requireMethod(req, res, "GET")) {
    const allowGuest = await getSetting("guestOrders", false);
    try {
      const PendingOrderModel = await getPendingOrderModel();
      const { id } = req.query;
      if (!id) {
        res.status(400).json({
          success: false,
          message: "No order id",
          orderIdNotFound: true,
        });
        return;
      }
      if (!ObjectId.isValid(id as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid order id",
          invalidOrderId: true,
        });
        return;
      }
      const checkoutOrder = await PendingOrderModel.findById(id as string);
      if (!checkoutOrder) {
        const OrderModel = await getOrderModel();
        const order = await OrderModel.findById(id as string);
        if (!order) {
          res.status(400).json({
            success: false,
            message: "Order not found",
            orderIdNotFound: true,
          });
        } else {
          res.status(200).json({
            success: true,
            message: "Order found",
            finished: true,
          });
        }
        return;
      }
      let token;
      if (checkoutOrder.user || !allowGuest) {
        // TODO make sure this works
        token = await requireLoggedIn(req, res, ["user"], true);
        if (!token) {
          return;
        }
        const isStaff =
          token.user && hasRoles(token.user?.roles, supportRoles, false);
        const userId = token.user._id.toString();
        if (
          checkoutOrder.user &&
          checkoutOrder.user.toString() !== userId &&
          !isStaff
        ) {
          res.status(400).json({
            success: false,
            message: "You are not the owner of this order",
            notOrderOwner: true,
          });
          return;
        }
      }
      if (!checkoutOrder) {
        res.status(400).json({
          success: false,
          message: "Order not found",
          orderNotFound: true,
        });
        return;
      }
      if (!checkoutOrder.subOrders) {
        res.status(400).json({
          success: false,
          message: "Order data not found (1)",
          orderDataNotFound: true,
        });
        return;
      }
      const orderData = checkoutOrder.subOrders[0];
      if (!orderData) {
        res.status(400).json({
          success: false,
          message: "Order data not found",
          orderDataNotFound: true,
        });
        return;
      }
      const method = checkoutOrder.paymentMethod;
      const price = checkoutOrder.totalPrice;
      if (method === "CashApp") {
        const ProductModel = await getProductModel();
        const product = await ProductModel.findById(
          orderData.product?.toString()
        );
        if (!product) {
          res.status(400).json({
            success: false,
            message: "Product not found",
            productNotFound: true,
          });
          return;
        }
        const option = product.options.find(
          (opt: ProductOption) =>
            opt._id?.toString() === orderData.productOptionId?.toString()
        );
        if (!option) {
          res.status(400).json({
            success: false,
            message: "Product option not found",
            optionNotFound: true,
          });
          return;
        }
        const stock = await getStockManager().getStockAmount(
          product._id,
          option._id
        );
        // const lines: number = option.stockLines;
        // const linesToGet = orderData.productQuantity * lines;
        if (stock < (orderData.productQuantity ?? 0)) {
          res.status(400).json({
            success: false,
            message: "Product out of stock",
            outOfStock: true,
          });
          return;
        }
        const result = await cashApp.verifyPayment(
          checkoutOrder.shortId || "",
          price,
          false // no need to check if read, as this will be done later.
        );
        if (result.success) {
          await cashApp.finalizePayment(checkoutOrder.shortId || "", price);
          const order = await completeOrderWithObj(
            checkoutOrder,
            {
              user: token?.user,
              email: checkoutOrder.email,
            },
            true,
            req
          );
          if (token) {
            token.user.showSupportButton = true;
            await token.user.save();
          }
          const metric: OrdersPaidMetric = {
            orderId: order?.data._id,
            userId: order?.data.user,
            price,
            guest: !order?.data.user,
          };
          await saveMetric(metric, ordersPaidMetricName);
          await saveMetric(
            {
              ...metric,
              provider: "CashApp",
            } as PaymentProviderOrderPaidMetric,
            cashAppPaidMetricName
          );
          res.status(200).json({
            success: true,
            message: "Successfully completed order.",
            finished: true,
            redirectUrl: `/pay/${
              order?.heldForVerification
                ? "wait"
                : order?.outOfStock
                ? "outofstock"
                : "success"
            }/?orderId=${order?.data._id.toString()}`,
          });
          return;
        }
        if (result?.awaitingAccept) {
          await cashApp.finalizePayment(checkoutOrder.shortId || "", price); // make it so that we don't check again
          await setOrderAsAwaitingAccept(checkoutOrder);
          res.status(200).json({
            success: true,
            message: "Please wait for the payment to be accepted.",
            finished: true,
            redirectUrl: `/pay/wait_accept/?orderId=${checkoutOrder._id.toString()}`,
          });
          return;
        }
        res.status(200).json({
          success: true,
          message: "Payment not found",
          paymentFound: false,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: "Payment method not found",
      });
    } catch (err) {
      log(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default withRateLimit(handler, 1, 3);
