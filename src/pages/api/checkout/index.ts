import Big from "big.js";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import {
  cashAppCreatedMetricName,
  coinbaseCreatedMetricName,
  OrderCreatedMetric,
  ordersCreatedMetricName,
  PaymentProviderOrderCreatedMetric,
} from "@app-types/metrics/SalesMetrics";
import { OrderInterface } from "@app-types/models/order";
import { ProductOption } from "@app-types/models/product";
import getFlaggedEmailModel from "@models/flaggedemails";
import { saveMetric } from "@models/metrics";
import { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import getUserModel from "@models/user";
import { getCurrentUser } from "@util/AuthUtils";
import { verifyCaptcha } from "@util/CaptchaUtils";
import { emailRegex } from "@util/commons";
import verifyEmailValidity from "@util/email/EmailVerifier";
import { completeOrderWithObj } from "@util/orders";
import { getPaymentProvider } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { getIp, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";
import { sellix, sellix_ } from "@lib/sellix";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    if (!(await verifyCaptcha(req, res))) {
      return;
    }
    const allowGuest = await getSetting("guestOrders", true);
    const user = await getCurrentUser(req, res);
    if (!user && !allowGuest) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }
    try {
      const ProductModel = await getProductModel();
      const { productId, optionId, quantity } = req.body;
      let email: string = (req.body.email ?? "").toLowerCase();
      const paymentMethod: any = req.body.paymentMethod as any;
      if (!(paymentMethod === "Sellix")) {
        res.status(400).json({
          success: false,
          message: "Payment method not supported",
        });
        return;
      }
      // sanity checks
      if (!productId || !optionId || !quantity || !paymentMethod) {
        res.status(400).json({ success: false, message: "Missing data" });
        return;
      }
      if (quantity < 1) {
        res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
        return;
      }
      if (email && !emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Invalid email (you can omit this field if logged in)",
        });
        return;
      }
      if (!user && !email) {
        res.status(400).json({
          success: false,
          message: "You must provide an email if not logged in",
        });
        return;
      }
      if (!email) {
        email = user?.email ?? "";
      }
      if (email) {
        const allowed = await verifyEmailValidity(email);
        if (!allowed.success) {
          res.status(400).json({
            success: false,
            message: allowed.message,
          });
          return;
        }
      }
      const product = await ProductModel.findById(productId as string).exec();
      if (!product) {
        res.status(400).json({ success: false, message: "Product not found" });
        return;
      }
      const option = product.options.find(
        (o: ProductOption) => o._id?.toString() === optionId.toString()
      );
      if (!option || option.hidden) {
        res.status(400).json({ success: false, message: "Option not found" });
        return;
      }
      const lines: number = option.stockLines;
      const linesToGet = quantity * lines;
      const stock = await getStockManager().getStockAmount(
        productId as string,
        optionId as string,
        false // don't use cache
      );
      if (stock < quantity) {
        res.status(400).json({ success: false, message: "Not enough stock" });
        return;
      }
      const provider = await getPaymentProvider(paymentMethod);
      if (!provider) {
        res.status(400).json({
          success: false,
          message: "Payment method not found",
        });
        return;
      }
      // if (paymentMethod === "CashApp") {
      //   const enableCashApp = (await getSetting(
      //     "enableCashApp",
      //     true
      //   )) as boolean;
      //   if (!enableCashApp) {
      //     res.status(400).json({
      //       success: false,
      //       message: "CashApp is not enabled",
      //     });
      //     return;
      //   }
      // }
      // using big here because of floating point errors
      const originalPrice = Big(option.price).times(quantity);
      const userBal = Big((user ? user.balance : 0) ?? 0);
      let price = originalPrice.minus(userBal);
      if (price.lt(0)) price = Big(0);
      if (price.gt(0) && paymentMethod === "Balance") {
        res.status(400).json({
          success: false,
          message: "Not enough balance",
        });
        return;
      }
      const isFree = price.lte(0);
      const isFreeBecauseOfBalance = !isFree && userBal.gte(originalPrice);
      let remainingBalance = userBal.minus(originalPrice);
      if (remainingBalance.lt(0)) remainingBalance = Big(0);
      let balanceSpent = Big(0); // the amount of balance that was spent, if any
      if (userBal.gt(0)) {
        balanceSpent = userBal;
        if (userBal.gt(originalPrice)) {
          balanceSpent = originalPrice;
        }
      }
      let fee = Big(0);

      if (price.gt(0) && paymentMethod === "CashApp") {
        const cashAppAdjustment: number = await getSetting(
          "cashAppAdjustment",
          100
        );
        const op = Big(price);
        // 100 = 0% increase, 110 = 10% increase, 90 = 10% decrease
        const cashAppFee = Big(cashAppAdjustment).div(100);
        price = price.times(cashAppFee);
        fee = fee.plus(op.minus(price).abs());
      }

      // round fee and price
      fee = fee.round(2, 0);
      price = price.round(2, 0);

      const FlaggedEmailModel = await getFlaggedEmailModel();
      const flaggedEmail = await FlaggedEmailModel.findOne({
        email: email?.toLowerCase(),
      }).exec();
      const UserModel = await getUserModel();
      let banned = user && user.banned;
      if (email && !user) {
        const userByEmail = await UserModel.findOne({
          email: email.toLowerCase(),
        }).exec();
        if (userByEmail) {
          banned = userByEmail.banned;
        }
      }
      if (banned) {
        res.status(400).json({
          success: false,
          message: "You are banned and cannot place orders",
        });
        return;
      }
      const PendingOrderModel = await getPendingOrderModel();
      const nOrder: OrderInterface = {
        status: "pending",
        timestamp: new Date(),
        paymentMethod,
        paid: isFree || isFreeBecauseOfBalance,
        totalPriceStr: `${price.toFixed(2)}`,
        totalPrice: price.toNumber(),
        originalPrice: originalPrice.toNumber(),
        userBalanceSpent: balanceSpent.toNumber(),
        image: product.image,
        email: user ? user.email : email,
        fee: fee.toNumber(),
        ip: getIp(req),
        subOrders: [
          {
            product: product._id,
            productName: product.name,
            productOptionId: option._id,
            productShortDescription: product.shortDescription || "",
            productQuantity: quantity,
            productOption: option.name,
            warrantyHours: option.warrantyHours,
            warrantyEnabled: product.warrantyEnabled && option.warrantyEnabled,
            productPrice: option.price,
            stockLines: linesToGet,
          },
        ],
      };

      if (flaggedEmail) {
        nOrder.metadata = {
          flagged: flaggedEmail._id.toString(),
        };
      }
      if (user) {
        nOrder.user = user._id;
        nOrder.username = user.username;
      }
      const data = new PendingOrderModel(nOrder);
      const order = await data.save();
      if (user) {
        await user.updateOne({ balance: remainingBalance.toNumber() }).exec();
      }
      if (isFree) {
        const finalOrder = await completeOrderWithObj(
          order,
          {
            user,
            email: order.email,
          },
          true,
          req
        );
        if (!finalOrder) {
          res.status(500).json({
            success: false,
            message: "Something went wrong completing the order",
          });
          return;
        }
        const url = `/pay/${
          finalOrder.heldForVerification ? "wait" : "success"
        }/?orderId=${finalOrder?.data._id}`;
        res.status(200).json({
          success: true,
          message: "Order created and paid",
          free: true,
          paymentUrl: url,
        });
        return;
      }
      // const paymentUrl = await provider?.createPayment(order, user);
      // if (!paymentUrl) {
      //   res.status(500).json({
      //     success: false,
      //     message: "Something went wrong generating the payment url",
      //   });
      //   return;
      // }

      const paymentUrl = await sellix.createInvoice(
        product.name,
        price as any,
        1,
        email
      );
      if (!paymentUrl) {
        res.status(500).json({
          success: false,
          message: "Something went wrong generating the payment url",
        });
        return;
      }

      let sellixorder = await sellix_.orders.get(paymentUrl.uniqid);
      var metadata: any = {};

      if (sellixorder.cashapp_note) {
        metadata["cashapp_note"] = sellixorder.cashapp_note;
      }
      if (sellixorder.crypto_address) {
        metadata["crypto_address"] = sellixorder.crypto_address;
      }
      //await data.save(); // TODO check if the modified shortid is saved
      /*
                  await redisClient.set(key, JSON.stringify(order));
                  const expMin = parseInt(process.env.ORDER_EXPIRY || "60", 10);
                  if (expMin >= 1) await redisClient.expire(key, expMin * 60);
                   */
      const metric: OrderCreatedMetric = {
        orderId: order._id,
        userId: user?._id,
        guest: !user,
        price: price.toNumber(),
      };
      await saveMetric(metric, ordersCreatedMetricName);
      await PendingOrderModel.updateOne(
        {
          _id: order._id,
        },
        { metadata: { uniqid: paymentUrl.uniqid, ...metadata } }
      );
      const metricName =
        paymentMethod === "CashApp"
          ? cashAppCreatedMetricName
          : paymentMethod === "Coinbase"
          ? coinbaseCreatedMetricName
          : "";
      if (metricName !== "") {
        const paymentProviderMetric: PaymentProviderOrderCreatedMetric = {
          ...metric,
          provider: paymentMethod,
        };
        await saveMetric(paymentProviderMetric, metricName);
      }
      res.status(200).json({
        success: true,
        message: "Order created",
        paymentUrl: paymentUrl.url,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default withRateLimit(handler, 1, 10);
