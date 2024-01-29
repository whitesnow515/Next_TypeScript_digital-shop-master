import axios from "axios";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { error as errorLog, log } from "@util/log";
import { getIp } from "@util/ServerUtils";

export async function verify(
  secret: string,
  response: string,
  ip: string
): Promise<any> {
  const url = `https://challenges.cloudflare.com/turnstile/v0/siteverify`;
  if ((process.env.USE_CAPTCHA || "true") !== "true") {
    return { success: true };
  }
  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", response);
    if (
      (process.env.SEND_IP_TO_CAPTCHA || "true") === "true" &&
      ip &&
      ip.length > 0
    )
      formData.append("remoteip", ip);
    const res = await axios.post(url, formData);
    return { data: res.data, settings: process.env };
  } catch (error) {
    errorLog("captcha", error);
    return null;
  }
}

export async function verifyCaptcha(req: NextApiRequest, res: NextApiResponse) {
  if ((process.env.USE_CAPTCHA || "true") !== "true") {
    return true;
  }
  const captchaResponse = req.body["cf-turnstile-response"];
  if (!captchaResponse) {
    res.status(422).json({
      error: true,
      success: false,
      message: "Please complete the captcha",
    });
    return false;
  }
  const captchaSecret = process.env.CAPTCHA_SECRET_KEY;
  if (!captchaSecret) {
    res.status(422).json({
      error: true,
      success: false,
      message: "Captcha secret key not set",
    });
    return false;
  }
  const ip = getIp(req);
  const captchaVerification = await verify(captchaSecret, captchaResponse, ip);
  const { data } = captchaVerification;
  log("captchaRes", data);
  if (!data.success) {
    res.status(422).json({
      error: true,
      success: false,
      message: `Captcha verification failed: ${data["error-codes"]}`,
      // data: captchaVerification,
    });
    return false;
  }
  return true;
}

const withCaptcha = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
      const captchaVerified = await verifyCaptcha(req, res);
      if (!captchaVerified) {
        return null;
      }
    }
    return handler(req, res);
  };
};
export default withCaptcha;
