import Big from "big.js";
import { NextApiRequest, NextApiResponse } from "next";

import {
    cashAppCreatedMetricName,
    coinbaseCreatedMetricName,
    OrderCreatedMetric,
    ordersCreatedMetricName,
    PaymentProviderOrderCreatedMetric,
} from "@app-types/metrics/SalesMetrics";
import { OrderInterface } from "@app-types/models/order";
import { ProductOption } from "@app-types/models/product";
import { PaymentProviderNames } from "@app-types/payment/providers";
import getFlaggedEmailModel from "@models/flaggedemails";
import { saveMetric } from "@models/metrics";
import { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import getUserModel from "@models/user";
import { getCurrentUser } from "@util/AuthUtils";
import { verifyCaptcha } from "@util/CaptchaUtils";
import { emailRegex } from "@util/commons";
import verifyEmailValidity from "@util/email/EmailVerifier";
import { log } from "@util/log";
import {completeOrderWithObj, completeOrderWithObjATC} from "@util/orders";
import { getPaymentProvider } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { getIp, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";
import {sellix, sellix_} from "@lib/sellix";
import { poof } from "@lib/poof";

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
            const { use_balance, orderId, order_confirm } = req.body;
            let email: string = user ? user.email : (req.body.email ?? "").toLowerCase();
           
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
            const nOrder=await PendingOrderModel.findOne({
                _id: orderId,
            })
            let total_amount = nOrder.totalPrice;
            if(use_balance && user.balance < total_amount){
                res.status(400).json({ success: false, message: 'Insufficient Balance' });
                return;
            }
            var enoughBalance = use_balance ? user.balance >0.00 : false;
            if (!enoughBalance && use_balance) {
                return res.status(400).json(
                    {
                        error: true,
                        message: 'No balance'
                    }
                )
            }
            var balAmount =user.balance > total_amount ? total_amount : user.balance;

            if (enoughBalance && use_balance && user.balance >= total_amount) {
                try {
                let userModel = await getUserModel()
                let userTakenBal = await userModel.updateOne({
                    _id: user._id,
                    balance: {$gte: balAmount}
                }, {
                    $inc: {
                        balance: -balAmount
                    }
                })
                
                if (!userTakenBal) {
                    // Handle the case where the update did not modify any document
                    console.error("Failed to update user balance");
                    enoughBalance = false;
                  }
                } catch (error) {
                  console.error("Error updating user balance:", error);
                  enoughBalance = false;
                }
            } 
           
            
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
            // const data = new PendingOrderModel(nOrder);
            // const order = await data.save();
            if(use_balance && user.balance>=total_amount){
                
                if (enoughBalance && balAmount === total_amount&&  user.balance>=total_amount) {
                    if(order_confirm){
                        await PendingOrderModel.updateOne({
                            _id: orderId,
                        }, {userBalanceSpent: balAmount})
                        const finalOrder = await completeOrderWithObjATC(
                            nOrder,
                            {
                                user,
                                email: nOrder.email,
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
                            success: true,
                            message: "Order created and paid",
                            free: true,
                            paymentUrl: url,
                        });
                        return;
                    }else{
                        res
                        .status(200)
                        .json({ success: true, message: "Order created", orderId:nOrder._id});
                    }
                }else{
                    res.status(400).json({ success: false, message: 'Insufficient Balance' });
                    return;
                }
            }else{
                res.status(400).json({
                    success: false,
                    message: "Something went wrong generating the payment",
                });
                return;
            }
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Something went wrong",
            });
        }
    }
}

export default withRateLimit(handler, 1000, 10);
