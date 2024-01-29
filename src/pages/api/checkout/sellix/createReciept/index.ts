import { getSetting } from "@util/SettingsHelper";
import axios from "axios";
import axiosProxy from "axios-proxy-fix";
import { NextApiRequest, NextApiResponse } from "next";

const SELLIX_API_URL = "https://dev.sellix.io/v1/payments";

const getProxy = async () => {
  const defaultSellixProxies = await getSetting("sellixProxies", []);
  const randomIndex = Math.floor(Math.random() * defaultSellixProxies.length);
  const randomProxy = defaultSellixProxies[randomIndex];
  if (randomProxy) {
    return {
      proxy: {
        host: randomProxy.host,
        port: randomProxy.port,
        auth: {
          username: randomProxy.auth.username,
          password: randomProxy.auth.password,
        },
      },
    };
  }
  return;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method Not Allowed" });
    }
    const proxy = await getProxy();

    const axiosInstance = proxy ? axiosProxy.create(proxy) : axios;
    // Extract the orderId from the query parameters
    const { price, email, currency } = req.body;

    if (!currency || !email || !price) {
      return res.status(400).json({
        success: false,
        message: "price, email and currency are required",
      });
    }

    await axiosInstance
      .post(
        SELLIX_API_URL,
        {
          title: "Sellix",
          value: price,
          currency: "USD",
          email,
          white_label: true,
          gateway: currency,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SELLIX_APIKEY}`,
            "User-Agent": req.headers["user-agent"],
            "Content-Type": "application/json",
            "X-Sellix-Merchant": process.env.SELLIX_MERCHANT,
          },
        }
      )
      .then((sellixResponse) => {
        res.status(sellixResponse.status).json(sellixResponse.data);
      })
      .catch((err) => {
        res.status(400).json({ success: false, message: err });
      });
  } catch (error) {
    console.error("Sellix API Proxy Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
