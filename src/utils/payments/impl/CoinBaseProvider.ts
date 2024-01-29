import crypto from "crypto";

import axios from "axios";
import { NextApiRequest } from "next";

import { OrderInterface } from "@app-types/models/order";
import { UserInterface } from "@app-types/models/user";
import { CoinbaseChargeMetadata, setTypes } from "@app-types/payment/coinbase";
import { PaymentProvider } from "@util/payments/PaymentProvider";
import { getSetting } from "@util/SettingsHelper";

export class CoinBaseProvider implements PaymentProvider {
  name = "Coinbase";

  iconUrl = "/assets/images/coinbase.webp";

  // "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/120px-Bitcoin.svg.png";

  createPayment(
    order: OrderInterface,
    user: UserInterface | null
  ): Promise<string> {
    return new Promise(async (resolve) => {
      const apiKey = await getSetting("coinbaseApiKey", "");
      const orderData = order.subOrders && order.subOrders[0];
      if (orderData == null) {
        throw new Error("No order data");
      }
      const res = await axios.post(
        "https://api.commerce.coinbase.com/charges",
        {
          name: orderData.productName,
          description: orderData.productShortDescription,
          pricing_type: "fixed_price",
          metadata: {
            ...(user
              ? {
                  customer_id: user?._id?.toString(),
                }
              : {}),
            customer_name: user?.username || "Guest",
            order_id: order._id?.toString() || "",
          } as CoinbaseChargeMetadata,
          local_price: {
            amount: order.totalPrice,
            currency: "USD",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CC-Api-Key": apiKey,
            "X-CC-Version": "2018-03-22",
          },
        }
      );
      const data = setTypes(res.data.data);
      order.metadata = {
        coinbase: data,
      };
      order.shortId = data.code;
      await (order as any).save();
      resolve(data.hosted_url);
    });
  }

  cancelPayment(coinbaseId: string) {
    return new Promise(async (resolve) => {
      const apiKey = await getSetting("coinbaseApiKey", "");
      const res = await axios.post(
        `https://api.commerce.coinbase.com/charges/${coinbaseId}/cancel`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CC-Api-Key": apiKey,
          },
        }
      );
      resolve(res.data);
    });
  }

  verifyPayment(
    paymentId: string,
    amount: number
  ): Promise<{ success: boolean; awaitingAccept?: boolean }> {
    return new Promise(async (resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }

  computeSignature(payload: any, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");
  }

  verifySigHeader(payload: any, sigHeader: string, secret: string): boolean {
    try {
      const computedSignature = this.computeSignature(payload, secret);
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(sigHeader)
      );
    } catch (e) {
      return false;
    }
  }

  verifyRequest(req: NextApiRequest): Promise<Boolean> {
    return new Promise<Boolean>(async (resolve, reject) => {
      // https://www.codedaily.io/tutorials/Stripe-Webhook-Verification-with-NextJS
      const rawBody = JSON.stringify(req.body);
      const sigHeader = req.headers["x-cc-webhook-signature"] as string;
      const secret = (await getSetting("coinbaseWebhookSecret", "")) || "";
      resolve(this.verifySigHeader(rawBody, sigHeader, secret));
    });
  }
}
