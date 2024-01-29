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
import getTopUpOrderModel from "@models/topuporder";
import { sellix } from "@lib/sellix";
import { completeStatus, pendingStatus } from "@root/currency";
import axios from "axios";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    if (!user && !allowGuest) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }
    const { topupId } = req.query;

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

    if (topupId) {
      const PendingOrderModel = await getPendingOrderModel();
      const TopupModel = await getTopUpOrderModel();
      const topupModel = await TopupModel.findById(topupId);
      const OrderModel = await getOrderModel();
      const pendingOrder =
        (await PendingOrderModel.findById(topupId)) ||
        (await OrderModel.findById(topupId));
      const ProductModel = await getProductModel();
      const expirationTime = moment(topupModel?.createdAt).add(8, "hour");
      const expirationTimeHourly = moment(topupModel?.createdAt).add(
        8,
        "hour"
      );
      const currentTime = moment();
      try {
         

        // ||pendingOrder?.metadata?.uniqid "AFz42yhnqvECESMZ4c8TEK"
        // let paymentInfo = await sellix.getOrder(topupModel?.uniqid as string);
        const sellixResponse = await axios.get(
          `http://localhost:3000/api/checkout/sellix/sellixReciept?orderId=${topupModel?.uniqid}`
        );
        let paymentInfo =sellixResponse.data?.data && sellixResponse.data?.data?.order;
        let paymentStatus: string;
        let paid = false;
        if (paymentInfo &&sellixResponse.data!==404) {
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

          let orderDetails = {
            gateway: paymentInfo.gateway,
            currency: paymentInfo.gateway,
            address: paymentInfo.crypto_address || paymentInfo.cashapp_note,
            qrcode: paymentInfo.crypto_uri || paymentInfo.cashapp_qrcode,
            due:paymentInfo.gateway !=="CASH_APP"? paymentInfo.crypto_amount || paymentInfo.amount: paymentInfo.total,
            paymentMethod: paymentInfo.gateway,
            cashTag:paymentInfo.gateway ==="CASH_APP" && paymentInfo?.cashapp_cashtag,
            // metadata:paymentInfo.metadata,
            orderItems: [],
            email: user.email,
            timestamp: topupModel.createdAt,
            paymentPaid: paymentStatus,
            paid,
          };
          await topupModel.updateOne(
            { _id: topupId },
            { $set: { status: paymentStatus } }
          );

          // Update the status of products in the subOrders array
          if (paid) {
            await topupModel.updateOne(
              {
                _id: topupId,
              },
              { status: "Completed" }
            );
            res.status(200).json({
              expire: false,
              success: true,
              message: "Topup Created",
            });
          } else {
               res.status(200).json({
                data: orderDetails,
                expire: false,
                success: true,
                message: "Order not paid yet",
              });
          }
        } else {
          if (currentTime.isAfter(expirationTime)) {
            await PendingOrderModel.deleteOne({
              _id: topupId,
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
