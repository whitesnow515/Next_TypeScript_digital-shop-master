import Big from "big.js";
import { NextApiRequest, NextApiResponse } from "next";

import {
  cashAppCreatedMetricName,
  OrderCreatedMetric,
  PaymentProviderOrderCreatedMetric,
  PaymentProviderOrderPaidMetric,
} from "@app-types/metrics/SalesMetrics";
import { OrderInterface } from "@app-types/models/order";
import { ProductOption } from "@app-types/models/product";
import getFlaggedEmailModel from "@models/flaggedemails";
import { saveMetric } from "@models/metrics";
import { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import getUserModel from "@models/user";
import { getCurrentUser } from "@util/AuthUtils";
import { getPaymentProvider } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { getIp, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";
import { poof } from "@lib/poof";
import getSettingsModel from "@models/settings";
import axios from "axios";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    /*        if (!(await verifyCaptcha(req, res))) {
                    return;
                }*/
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    if (!user && !allowGuest) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }
    try {
      const ProductModel = await getProductModel();
      const SettingsModel = await getSettingsModel();
      const settingsDiscountData = await SettingsModel.findOne({
        key: "discountProducts",
      });
      const {
        items,
        use_balance,
        use_crypto,
        pending_order,
        orderId,
        currency,
        order_confirm,
        promoCode,
      } = req.body;
      let email: string = user
        ? user.email
        : (req.body.email ?? "").toLowerCase();

      const subOrders = [];
      let total_amount = 0;
      if (items.length > 0) {
        for (var item of items) {
          const { productId, optionId, quantity } = item;
          if (!productId || !optionId || !quantity) {
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
          const product = await ProductModel.findById(
            productId as string
          ).exec();
          if (!product) {
            res
              .status(400)
              .json({ success: false, message: "Product not found" });
            return;
          }

          if (
            (product.maximum && quantity > product.maximum) ||
            (product.minimum && quantity < product.minimum)
          ) {
            res.status(400).json({
              success: false,
              message: "Quantity specified unavailable",
            });
            return;
          }

          const option = product.options.find(
            (o: ProductOption) => o._id?.toString() === optionId.toString()
          );
          if (!option || option.hidden) {
            res
              .status(400)
              .json({ success: false, message: "Option not found" });
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
            res.status(400).json({
              success: false,
              message: `${option.name} is out of stock`,
              stock: false,
            });
            return;
          }
          const provider = await getPaymentProvider("Sellix");
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
          let originalPrice = Big(0);
          let discount = Big(0);
          const userBal = Big((user ? user.balance : 0) ?? 0);

          if (settingsDiscountData) {
            const valuedata = settingsDiscountData.value;
            const value = valuedata.find(
              (value: any) => value.paymentMethod === currency
            );

            if (value) {
              let discountValue = parseInt(value.discount);
              discount = Big(discountValue).div(100);

              if (promoCode && promoCode !== value.code) {
                res.status(400).json({
                  success: false,
                  message: "Promocode not correct",
                });
                return;
              }
              const discountProducts = value.products as string[];
              if (discountProducts && discountProducts.length !== 0) {
                let data = discountProducts.find(
                  (data) => data === product._id.toString()
                );
                if (
                  data === product._id.toString() &&
                  promoCode === value.code
                ) {
                  const option = product.options.find(
                    (o: ProductOption) =>
                      o._id?.toString() === optionId.toString()
                  );
                  const discount = Big(discountValue).div(100);
                  const orignalOptionPrice = Big(option.price).times(quantity);
                  // Subtract the discount from the original price
                  originalPrice = orignalOptionPrice.minus(
                    orignalOptionPrice.times(discount)
                  );
                  // originalPrice =  Big(option.price).times(quantity);
                } else {
                  originalPrice = Big(option.price).times(quantity);
                }
                //   finalDiscountProducts = {
                //     products: finalData,
                //     discountValue: value.discount,
                //     discountCode: value.code,
                //   };
              }
            } else {
              originalPrice = Big(option.price).times(quantity);
            }
          } else {
            originalPrice = Big(option.price).times(quantity);
          }

        
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

         
          fee = fee.round(2, 0);
          total_amount += Number(originalPrice.toFixed(2));
          

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
          subOrders.push({
            product: product._id,
            productName: product.name,
            productOptionId: option._id,
            productShortDescription: product.shortDescription || "",
            productQuantity: quantity,
            productOption: option.name,
            warrantyHours: option.warrantyHours,
            warrantyEnabled: product.warrantyEnabled && option.warrantyEnabled,
            productPrice: Number(originalPrice.toFixed(2)),
            stockLines: linesToGet,
            discount: discount?.toFixed(2) || 0,
          });
        }

        if (currency === "CASH_APP" && total_amount < 1) {
          res.status(400).json({
            success: false,
            message:
              "Using Cash App, the order total cannot be lower than USD 1.00",
          });
          return;
        }
        let fee = Big(0);
        if (total_amount > 0 && currency === "CASH_APP") {
          const cashAppAdjustment: number = await getSetting(
            "cashAppAdjustment",
            100
          );
          // 100 = 0% increase, 110 = 10% increase, 90 = 10% decrease
          const cashAppFee = Big(cashAppAdjustment).div(100);
          // const op = Big(total_amount);
          total_amount = total_amount + cashAppFee.toNumber();
          fee = cashAppFee;
        }

        if (use_balance && user.balance < total_amount) {
          res
            .status(400)
            .json({ success: false, message: "Insufficient Balance" });
          return;
        }
        var enoughBalance = use_balance ? user.balance > 0.0 : false;
        if (!enoughBalance && use_balance) {
          return res.status(400).json({
            error: true,
            message: "No balance",
          });
        }

        const balAmount =
          user.balance > total_amount ? total_amount : user.balance;
        const PendingOrderModel = await getPendingOrderModel();
        const nOrder: OrderInterface | any = {
          status: "pending",
          timestamp: new Date(),
          paymentMethod: enoughBalance ? "Balance" : currency,
          paid: false,
          totalPriceStr: `${total_amount.toFixed(2)}`,
          totalPrice: total_amount,
          originalPrice: 0,
          userBalanceSpent: 0,
          image: "",
          email: user ? user.email : email,
          fee: fee.toFixed(2),
          ip: getIp(req),
          subOrders,
        };
        const FlaggedEmailModel = await getFlaggedEmailModel();

        const flaggedEmail = await FlaggedEmailModel.findOne({
          email: email?.toLowerCase(),
        }).exec();

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
        if (use_balance && user.balance >= total_amount && items.length > 0) {
          if (
            enoughBalance &&
            balAmount === total_amount &&
            user.balance >= total_amount
          ) {
            const metric: OrderCreatedMetric = {
              orderId: order._id || nOrder._id,
              userId: user?._id || nOrder.user,
              guest: !user || !nOrder.user,
              price: Number(total_amount || nOrder.totalPrice),
            };
            const paymentProviderMetric: PaymentProviderOrderCreatedMetric = {
              ...metric,
              provider: currency,
            };
            await saveMetric(paymentProviderMetric, "ordersCreated");
            res.status(200).json({
              success: true,
              message: "Order created",
              orderId: order._id,
            });
          } else {
            res
              .status(400)
              .json({ success: false, message: "Insufficient Balance" });
            return;
          }
          // if (user) {
          //     await user.updateOne({ balance: remainingBalance.toNumber() }).exec();
          // }

          // const paymentUrl = await provider?.createPayment(order, user);
          // if (!paymentUrl) {
          //   res.status(500).json({
          //     success: false,
          //     message: "Something went wrong generating the payment url",
          //   });
          //   return;
          // }
        } else if (!use_balance && use_crypto) {
          //Number(total_amount)
          const sellixAmount = use_balance
            ? total_amount - balAmount
            : total_amount;
          let paymentDetails: any;
          const pendingOrderData = await PendingOrderModel.findById(orderId);
          if (pending_order) {
            // price: number currency: string, items:any
            paymentDetails =
              pendingOrderData.subOrders &&
              (await poof.createInvoice(
                pendingOrderData?.totalPrice,
                currency,
                items
              ));
          } else {
            let sellixPostPayment = await axios.post(
              "http://localhost:3000/api/checkout/sellix/createReciept",
              {
                price: nOrder.totalPrice,
                currency,
                email: nOrder.email,
              }
            );
            // nOrder.subOrders && await sellix.createInvoice(nOrder.totalPrice, currency, items,nOrder.email)
            paymentDetails = sellixPostPayment.data.data
              ? sellixPostPayment.data.data.invoice
              : sellixPostPayment.data;
          }

          if (
            (!paymentDetails || !paymentDetails.uniqid) &&
            paymentDetails.error &&
            paymentDetails.status === 400
          ) {
            res.status(400).json({
              success: false,
              message: paymentDetails.error,
            });
            return;
          }

          var metadata: any = {};

          if (paymentDetails) {
            metadata["crypto_address"] =
              currency === "CASH_APP"
                ? paymentDetails.cashapp_note
                : paymentDetails.crypto_address;
            metadata["payment_active"] = true;
            metadata["payment_paid"] = paymentDetails.status;
          }
          //await data.save(); // TODO check if the modified shortid is saved
          /*
                    await redisClient.set(key, JSON.stringify(order));
                    const expMin = parseInt(process.env.ORDER_EXPIRY || "60", 10);
                    if (expMin >= 1) await redisClient.expire(key, expMin * 60);
                     */
          const metric: OrderCreatedMetric = {
            orderId: order._id || nOrder._id,
            userId: user?._id || nOrder?.user,
            guest: !user || !nOrder?.user,
            price: Number(total_amount || nOrder?.totalPrice),
          };
          // await saveMetric(metric, ordersCreatedMetricName);
          await PendingOrderModel.updateOne(
            {
              _id: order._id || pendingOrderData._id,
            },
            { metadata: { uniqid: paymentDetails.uniqid, ...metadata } }
          );

          if (currency === "CASH_APP") {
            await saveMetric(
              {
                ...metric,
                provider: nOrder.paymentMethod,
              } as PaymentProviderOrderPaidMetric,
              cashAppCreatedMetricName
            );
          } else {
            const paymentProviderMetric: PaymentProviderOrderCreatedMetric = {
              ...metric,
              provider: currency,
            };
            await saveMetric(paymentProviderMetric, "ordersCreated");
          }

          res.status(200).json({
            success: true,
            message: "Order created",
            orderId: order._id,
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Something went wrong generating the payment",
          });
          return;
        }
      }
      res.status(402).json({
        success: false,
        message: "Please select the product",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default withRateLimit(handler, 1000, 10);
