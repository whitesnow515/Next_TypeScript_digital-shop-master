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
import { completeOrderWithObj } from "@util/orders";
import { getPaymentProvider } from "@util/payments/PaymentProviderHolder";
import withRateLimit from "@util/RateLimit";
import { getIp, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import getStockManager from "@util/stock/StockManagerHolder";
import {sellix, sellix_} from "@lib/sellix";
import getTopUpOrderModel from "@models/topuporder";
import { poof } from "@lib/poof";
import axios from "axios";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requireMethod(req, res, "POST")) {
        // if (!(await verifyCaptcha(req, res))) {
        //     return;
        // }
        const allowGuest = await getSetting("guestOrders", false);
        const user = await getCurrentUser(req, res);
        if (!user && !allowGuest) {
            res.status(401).json({ success: false, message: "Not logged in" });
            return;
        }
        try {
            const { amount, currency} = req.body;

            
            // sanity checks
            if (!amount) {
                res.status(400).json({ success: false, message: "Missing data" });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Cannot deposit less than 0 USD",
                });
                return;
            }
            if (!parseFloat(amount)) return res.status(400).json({
                error: true,
                message: 'Invalid "amount" specified'
            })

            if (!user) {
                res.status(400).json({
                    success: false,
                    message: "You must provide an email if not logged in",
                });
                return;
            }
           
           

            let fee=Big(0)
            let total_amount=amount
                    
            
                if (currency==="CASH_APP" && total_amount < 1) {
                        res.status(400).json({
                            success: false,
                            message: "Using Cash App, the order total cannot be lower than USD 1.00",
                        });
                        return;
                }


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

            // price: number, currency: string, items?:any,email?:any
            let sellixPostPayment = await axios.post("http://localhost:3000/api/checkout/sellix/createReciept",{
                price: total_amount, 
                currency, 
                email:user.email
            })
           const paymentDetails=sellixPostPayment.data.data ? sellixPostPayment.data.data.invoice : sellixPostPayment.data
           if ((!paymentDetails || !paymentDetails.uniqid ) && paymentDetails.error && paymentDetails.status===400) {
            res.status(400).json({
                success: false,
                message: paymentDetails.error,
            });
            return;
            }
            // const parts = paymentDetails.payment_link.split('/');
            // const lastId = parts[parts.length - 1];
            
            // if(currency==="cashapp"){
            //      paymentInfo = await poof.getPaymentInfo(lastId)
            // }else{
            //      paymentInfo = await poof.getPaymentInfo(paymentDetails.payment_id)
            // }
            var metadata: any = {};

          if (paymentDetails) {
            metadata["crypto_address"] =
              currency === "CASH_APP"
                ? paymentDetails.cashapp_note
                : paymentDetails.crypto_address;
            metadata["payment_active"] = true;
            metadata["cashapp_note"] = paymentDetails.cashapp_note;
            metadata["gateway"]=paymentDetails.gateway
          }
            const topupModel = await getTopUpOrderModel()
            const topupOrder = await topupModel.create({
                uniqid: paymentDetails.uniqid,
                amount: parseFloat(amount),
                // crypto_address:currency === "CASH_APP"? paymentDetails.cashapp_note : paymentDetails.crypto_address,
                user: user._id,
            })
            await topupModel.updateOne(
                {
                  _id: topupOrder._id,
                },
                { sellix: { uniqid: paymentDetails.uniqid,amount: parseFloat(amount), user: user._id, ...metadata } }
              );
            await topupOrder.save();
            if(paymentDetails){
                res
                    .status(200)
                    .json({ success: true, message: "Top up order initiated", orderId:topupOrder._id.toString() });
            }else{
                res.status(402).json({
                    success: false,
                    message: "Something went wrong during payment",
                });
            }
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Something went wrong",
            });
        }
    }
}

export default withRateLimit(handler, 1, 10);
