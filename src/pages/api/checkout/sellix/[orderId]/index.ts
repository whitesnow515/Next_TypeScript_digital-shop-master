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
import { sellix } from "@lib/sellix";
import axios from "axios";
import { completeStatus, pendingStatus } from "@root/currency";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    // if (!user && !allowGuest) {
    //   res.status(401).json({ success: false, message: "Not logged in" });
    //   return;
    // }
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
      const expirationTime = moment(pendingOrder?.timestamp).add(8, "hour");
      const expirationTimeHourly = moment(pendingOrder?.timestamp).add(
        8,
        "hour"
      );
      const currentTime = moment();
      try {
        if(pendingOrder){
          if (pendingOrder && pendingOrder?.paymentMethod !== "Balance") {
            // ||pendingOrder?.metadata?.uniqid "AFz42yhnqvECESMZ4c8TEK"
            const sellixResponse = await axios.get(
              `http://localhost:3000/api/checkout/sellix/sellixReciept?orderId=${pendingOrder?.metadata?.uniqid}`
            );
            
            let paymentInfo =sellixResponse.data.data && sellixResponse.data.data?.order;
            let paymentStatus: string;
            let paid = false;
                if (paymentInfo && pendingOrder && sellixResponse.data!==404) {
                  const promises =
                    pendingOrder &&
                    pendingOrder.subOrders.map(async (data: any) => {
                      const allProducts = await ProductModel.findOne({
                        "options._id": { $in: new ObjectId(data.productOptionId) },
                      })
                        .populate({
                          path: "options",
                          match: { _id: new ObjectId(data.productOptionId) },
                          select: "-stockCheckerConfig",
                        })
                        .select(["-stockCheckerConfig"]);

                      const matchedOption = allProducts
                        ? allProducts.options.find(
                            (opt: any) =>
                              opt._id.toString() === data.productOptionId.toString()
                          )
                        : undefined;
                      return {
                        ...allProducts.toObject(),
                        options: matchedOption,
                        status:data.status,
                        quantity: data.productQuantity,
                      };
                    });

                  const orderProducts = await Promise.all(promises);
                  if (completeStatus.includes(paymentInfo.status)) {
                    paymentStatus = paymentInfo.status;
                    paid = true;
                  } else if (
                    pendingStatus.includes(paymentInfo.status) &&
                    paymentInfo.status !== "PENDING"
                  ) {
                    paymentStatus = paymentInfo.status;
                    paid = true;
                  } else if (pendingStatus.includes(paymentInfo.status)) {
                    paymentStatus = paymentInfo.status;
                    paid = false;
                  } else {
                    paymentStatus = paymentInfo.status;
                    paid = false;
                  }

                  await PendingOrderModel.updateOne(
                    { _id: orderId },
                    { $set: { status: paymentInfo.status } }
                  );

                  // Update the status of products in the subOrders array
                  await PendingOrderModel.updateOne(
                    { _id: orderId },
                    { $set: { "subOrders.$[].status": paymentInfo.status } }
                  );
                  let orderDetails = {
                    gateway: paymentInfo.gateway,
                    currency: paymentInfo.gateway,
                    address: paymentInfo.crypto_address || paymentInfo.cashapp_note,
                    qrcode: paymentInfo.crypto_uri || paymentInfo.cashapp_qrcode,
                    due:paymentInfo.gateway !=="CASH_APP"? paymentInfo.crypto_amount || paymentInfo.amount: paymentInfo.total,
                    paymentMethod: paymentInfo.gateway,
                    cashTag:paymentInfo.gateway ==="CASH_APP" && paymentInfo?.cashapp_cashtag,
                    orderItems: [].concat(...orderProducts),
                    email: pendingOrder.email,
                    timestamp: pendingOrder.timestamp,
                    paymentPaid: paymentStatus,
                    paid,
                  };

                  if (paid) {
                    await (PendingOrderModel).updateOne(
                      {
                        _id: orderId,
                      },
                      {
                        metadata: {
                          uniqid: paymentInfo.uniqid,
                          crypto_address: paymentInfo?.crypto_address,
                          payment_active: false,
                          payment_paid: paymentStatus,
                        },
                      }
                    );
                    if (paymentInfo.status==="COMPLETED" && orderPending) {
                      
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
                      res.status(200).json({
                        data: orderDetails,
                        expire: false,
                        success: true,
                        message: "Order not paid yet",
                      });
                  }
                } else {
                  if (currentTime.isAfter(expirationTimeHourly)) {
                    await PendingOrderModel.deleteOne({
                      _id: orderId,
                    });
                  }
                  res.status(200).json({
                    expire: currentTime.isAfter(expirationTime) ? true : false,
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
                    })
                      .populate({
                        path: "options",
                        match: { _id: new ObjectId(data.productOptionId) },
                        select: "-stockCheckerConfig",
                      })
                      .select(["-stockCheckerConfig"]);
  
                    const matchedOption = allProducts
                      ? allProducts.options.find(
                          (opt: any) =>
                            opt._id.toString() === data.productOptionId.toString()
                        )
                      : undefined;
                    return {
                      ...allProducts.toObject(),
                      options: matchedOption,
                      status:data.status,
                      quantity: data.productQuantity,
                    };
                  });
  
                const orderProducts = await Promise.all(promises);
                
                let paymentStatus;
                if(pendingOrder.status==="completed"){
                  paymentStatus = "COMPLETED";
                }else{
                  paymentStatus = pendingOrder.status;
                }
                
  
                let orderDetails = {
                  amount: pendingOrder.totalPriceStr,
                  gateway: "Balance",
                  currency: pendingOrder.paymentMethod,
                  address: "",
                  due: pendingOrder.totalPriceStr,
                  paymentMethod: pendingOrder.paymentMethod,
                  // metadata:paymentInfo.metadata,
                  orderItems: [].concat(...orderProducts),
                  email: pendingOrder.email,
                  timestamp: pendingOrder.timestamp,
                  paymentPaid: paymentStatus,
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
         
        }else {
          if (currentTime.isAfter(expirationTimeHourly)) {
            await PendingOrderModel.deleteOne({
              _id: orderId,
            });
          }
          res.status(200).json({
            expire: currentTime.isAfter(expirationTime) ? true : false,
            success: true,
            message: "Order details not found.",
          });
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