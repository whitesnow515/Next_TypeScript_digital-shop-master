import { poof } from "@lib/poof";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import { requireMethod } from "@util/ServerUtils";
import moment from "moment";
import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";
import { completeOrderWithObjATC } from "@util/orders";
import { getSetting } from "@util/SettingsHelper";
import { getCurrentUser } from "@util/AuthUtils";
import getUserModel from "@models/user";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    if (!user && !allowGuest) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }
    const { orderId } = req.query;
    let email: string = user
      ? user.email
      : (req.body.email ?? "").toLowerCase();
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

    if (orderId) {
      const PendingOrderModel = await getPendingOrderModel();
      const OrderModel = await getOrderModel();
      const orderPending = await PendingOrderModel.findById(orderId);
      const orderComplete = await OrderModel.findById(orderId);
      const pendingOrder = orderComplete ? orderComplete : orderPending;
      const ProductModel = await getProductModel();

      const expirationTime = moment(pendingOrder?.timestamp).add(1, "hour");
      const expirationTimeHourly = moment(pendingOrder?.timestamp).add(
        24,
        "hour"
      );
      const currentTime = moment();
      try {
        if (pendingOrder && pendingOrder?.paymentMethod !== "Balance") {
          // ||pendingOrder?.metadata?.uniqid "AFz42yhnqvECESMZ4c8TEK"
          let paymentInfo = await poof.getPaymentInfo(
            pendingOrder?.metadata?.uniqid as string
          );
          let paymentStatus: string;
          let paid = false;
          if (paymentInfo && paymentInfo.metadata) {
            const promises = paymentInfo.metadata.order_info
              ? paymentInfo.metadata.order_info.map(async (data: any) => {
                  const allProducts = await ProductModel.findOne({
                    "options._id": { $in: new ObjectId(data.optionId) },
                  }).populate({
                    path: "options",
                    match: { _id: new ObjectId(data.optionId) },
                  });

                  const matchedOption = allProducts
                    ? allProducts.options.find(
                        (opt: any) => opt._id.toString() === data.optionId
                      )
                    : undefined;
                  return {
                    ...allProducts.toObject(),
                    options: matchedOption,
                    quantity: data.quantity,
                  };
                })
              : paymentInfo.metadata.external.order_info.map(
                  async (data: any) => {
                    const allProducts = await ProductModel.findOne({
                      "options._id": { $in: new ObjectId(data.optionId) },
                    }).populate({
                      path: "options",
                      match: { _id: new ObjectId(data.optionId) },
                    });

                    const matchedOption = allProducts
                      ? allProducts.options.find(
                          (opt: any) => opt._id.toString() === data.optionId
                        )
                      : undefined;
                    return {
                      ...allProducts.toObject(),
                      options: matchedOption,
                      quantity: data.quantity,
                    };
                  }
                );

            const orderProducts = await Promise.all(promises);
            if (paymentInfo.paid === "yes") {
              paymentStatus = "Payment Confirmed";
              paid = true;
            } else if (paymentInfo.paid === "processing") {
              paymentStatus = "Pending";
              paid = true;
            } else {
              (paymentStatus = "Not Paid"), (paid = false);
            }

            let orderDetails = {
              amount: paymentInfo.amount,
              gateway: paymentInfo.gateway,
              currency: paymentInfo.currency,
              address:
                paymentInfo.payment_method === "cashapp"
                  ? paymentInfo.payment_id
                  : paymentInfo?.destination || paymentInfo.metadata?.address,
              due: paymentInfo.metadata.due,
              paymentMethod:
                paymentInfo.paymentMethod || paymentInfo.payment_method,
              // metadata:paymentInfo.metadata,
              orderItems: [].concat(...orderProducts),
              email: pendingOrder.email,
              timestamp: pendingOrder.timestamp,
              status: paymentStatus,
              paid,
            };
            if (paid) {
              await PendingOrderModel.updateOne(
                {
                  _id: orderId,
                },
                {
                  metadata: {
                    uniqid: paymentInfo.payment_id,
                    crypto_address: paymentInfo?.destination,
                    payment_active: false,
                    payment_paid: paymentStatus,
                  },
                }
              );
              if (paymentInfo.paid === "yes") {
                const finalOrder = await completeOrderWithObjATC(
                  pendingOrder,
                  {
                    user,
                    email: pendingOrder.email,
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
                }/?orderId=${finalOrder?._id}`;
                res.status(200).json({
                  data: orderDetails,
                  expire: false,
                  success: true,
                  message: "Order Paid",
                });
              } else {
                res.status(200).json({
                  data: orderDetails,
                  expire: false,
                  success: true,
                  message: "Order Payment is in processing",
                });
              }
            } else {
              if (currentTime.isAfter(expirationTimeHourly)) {
                await PendingOrderModel.deleteOne({
                  _id: orderId,
                });
                res.status(200).json({
                  expire: false,
                  success: true,
                  message: "Success",
                });
              } else {
                res.status(200).json({
                  data: orderDetails,
                  expire: currentTime.isAfter(expirationTime) ? true : false,
                  success: true,
                  message: "Order not paid yet",
                });
              }
            }
          } else {
            res.status(200).json({
              expire: false,
              success: true,
              message: "Order details not found.",
            });
          }
        } else {
          try {
            if (pendingOrder && pendingOrder.paymentMethod === "Balance") {
              const promises =
                pendingOrder.subOrders &&
                pendingOrder.subOrders.map(async (data: any) => {
                  const allProducts = await ProductModel.findOne({
                    "options._id": { $in: new ObjectId(data.productOptionId) },
                  }).populate({
                    path: "options",
                    match: { _id: new ObjectId(data.productOptionId) },
                  });

                  const matchedOption = allProducts
                    ? allProducts.options.find(
                        (opt: any) =>
                          opt._id.toString() === data.productOptionId.toString()
                      )
                    : undefined;
                  return {
                    ...allProducts.toObject(),
                    options: matchedOption,
                    quantity: data.productQuantity,
                  };
                });

              const orderProducts = await Promise.all(promises);
             

              let orderDetails = {
                amount: pendingOrder.totalPriceStr,
                gateway: "Balance",
                currency: pendingOrder.paymentMethod,
                address: "",
                due: pendingOrder.totalPrice,
                paymentMethod: pendingOrder.paymentMethod,
                // metadata:paymentInfo.metadata,
                orderItems: [].concat(...orderProducts),
                email: pendingOrder.email,
                timestamp: pendingOrder.timestamp,
                status: "Not paid yet",
                paid: pendingOrder.paid,
              };
              res.status(200).json({
                data: orderDetails,
                expire: false,
                success: true,
                message: "Order not Paid yet.",
              });
            } else {
              res.status(200).json({
                expire: false,
                success: true,
                message: "Order details not found.",
              });
            }
          } catch (err) {
            console.log(err, "New error");
          }
        }
      } catch (err) {
        res.status(402).json({
          success: false,
          message: "Something went wrong.",
        });
      }
    } else {
      res.status(402).json({
        success: false,
        message: "Order not found.",
      });
    }
  }
}

export default handler;
