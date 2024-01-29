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

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requireMethod(req, res, "GET")) {
        let query: any = req.query
        if (!query.products ){
            return res.json({error: true, message: 'No products specified'})
        }

        let productModel = await getProductModel()
        let products = query.products.split(",")
        let prods = [];

        for (var prod of products) {
            let prod_ = await productModel.findOne({
                'options._id': prod, hidden: false
            }, 'minimum maximum p options.price options._id options.name')
            if (!prod_) continue
            prods.push({
                minimum: prod_.minimum,
                maximum: prod_.maximum,
                price: prod_.options.find((x:any )=> x._id.toString() ===prod).price,
                name: prod_.options.find((x:any )=> x._id.toString() ===prod).name,
                id: prod
            })
        }
        return res.json({
            results: prods
        })
    }
}

export default withRateLimit(handler, 20, 100);
