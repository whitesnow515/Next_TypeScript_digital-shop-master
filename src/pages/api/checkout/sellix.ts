
import { NextApiRequest, NextApiResponse } from "next";
import crypto from 'crypto'
import {getPendingOrderModel} from "@models/order";
import getUserModel from "@models/user";
import {error} from "@util/log";
import {completeOrderWithObj, completeOrderWithObjATC} from "@util/orders";
import {
    coinbasePaidMetricName,
    OrdersPaidMetric,
    ordersPaidMetricName,
    PaymentProviderOrderPaidMetric
} from "@app-types/metrics/SalesMetrics";
import {saveMetric} from "@models/metrics";
import { buffer } from 'micro';
import getTopUpOrderModel from "@models/topuporder";
//



// }
async function handler(req: NextApiRequest, res: NextApiResponse) {

    const secret =process.env.SELLIX_WEBHOOKSECRET as any;
    const headerSignature = req.headers['x-sellix-unescaped-signature'] as any;
    const payload = Buffer.from(JSON.stringify(req.body));


    const signature = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');


    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(headerSignature, 'utf-8'))) {
        const PendingOrderModel = await getPendingOrderModel();
        const TopUpModel = await getTopUpOrderModel();
        const UserModel = await getUserModel();


        const uniqId = req.body.data.uniqid;
        const orderData = await PendingOrderModel.findOne({
            'metadata.uniqid': uniqId
        }).lean().exec();



        if (!orderData) {
            // may be top up
            const orderData = await TopUpModel.findOne({
                uniqid: uniqId

            }).lean().exec();


            if (orderData) {
               await UserModel.findOneAndUpdate({_id :orderData.user}, {$inc : {'balance' : orderData.amount}, $set: {status: 'paid', paid_at: new Date()}}).exec();

               await TopUpModel.findOneAndUpdate({_id :orderData._id}, {$set: {status: 'paid', sellix: {
                            id: req.body.data.id,
                            customer_id: req.body.data.customer_id,
                            gateway: req.body.data.gateway,
                            total: req.body.data.total,
                            crypto_address: req.body.data.crypto_address,
                            crypto_amount: req.body.data.crypto_amount,
                            crypto_received: req.body.data.crypto_received,
                            is_vpn_or_proxy: req.body.data.is_vpn_or_proxy,
                           cashapp_note: req.body.cashapp_note,

                           ip: req.body.data.ip
                        }, paid_at: new Date()}}).exec();
                return res.status(200).json({
                    success: false,
                    message: 'OK'
                })
            }

            return res.status(400).json({
                success: false,
                message: 'Unknown uniqid'
            })
        }
        if (!orderData) {
            res.status(400).json({
                success: false,
                message: "Order not found",
            });
            return;
        }
        if (orderData) {
            let user = null;
            if (orderData.user) {
                const UserModel = await getUserModel();
                user = await UserModel.findById(orderData.user);
                if (!user) {
                    error("User not found (", orderData.user, ")");
                    res.status(400).json({ success: false, message: "User not found" });
                    return;
                }
                user.showSupportButton = true;
                await user.save();
            }
            req.body =  req.body.data;

            if (orderData.subOrders.length >1) {
                {/* @ts-ignore */}
                await completeOrderWithObjATC({
                    ...orderData,
                    sellix: {
                        id: req.body.id,
                        customer_id: req.body.customer_id,
                        gateway: req.body.gateway,
                        total: req.body.total,
                        crypto_address: req.body.crypto_address,
                        crypto_amount: req.body.crypto_amount,
                        crypto_received: req.body.crypto_received,
                        is_vpn_or_proxy: req.body.is_vpn_or_proxy,
                        cashapp_note: req.body.cashapp_note,

                        ip: req.body.ip
                    }, metadata: {
                        cashapp_note: req.body.cashapp_note,
                        crypto_address: req.body.crypto_address,

                    }
                })

                return res.json({message: 'atc'})
            }
            const order = await completeOrderWithObj(
                {...orderData,
                    sellix: {
                        id: req.body.id,
                        customer_id: req.body.customer_id,
                        gateway: req.body.gateway,
                        total: req.body.total,
                        crypto_address: req.body.crypto_address,
                        crypto_amount: req.body.crypto_amount,
                        crypto_received: req.body.crypto_received,
                        is_vpn_or_proxy: req.body.is_vpn_or_proxy,
                        ip: req.body.ip
                    }, metadata: {
                        cashapp_note: req.body.cashapp_note,
                        crypto_address: req.body.crypto_address,

                    }
                },
                {
                    user,
                    email: orderData.email,
                },
                true,
                req
            );
            if (!order) {
                error("Failed to complete order (", orderData._id.toString(), ")");
                res.status(400).json({
                    success: false,
                    message: "Something went wrong completing that order!",
                });
                return;
            }
            const metric: OrdersPaidMetric = {
                orderId: order.data._id,
                userId: order.data.user,
                price: orderData.totalPrice,
                guest: !order.data.user,
            };
            await saveMetric(metric, ordersPaidMetricName);
            await saveMetric(
                {
                    ...metric,
                    provider: "Sellix",
                } as any,
                coinbasePaidMetricName
            );
        }
        res.json({error: false, message: 'afssfa'})

        // handle valid webhook
    } else {
        res.json({error: true, message: 'badf'})
        // invalid webhook
    }
}

export default handler;
