import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import { SocksProxyAgent } from "socks-proxy-agent";

import { debug } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { getSetting } from "@util/SettingsHelper";

export const adminOnlySettings = [
  "proxies",
  "smtp_credentials",
  "emailVerificationApiUrl",
  "coinbaseApiKey",
  "coinbaseWebhookSecret",
  "cashAppEmailSecret",
  "stockCheckerApiUrl",
  "stockCheckerProxies",
  "smtp_proxies",
];
interface GetBaseUrlParams {
  removeTrailingSlash?: boolean;
}

export function getBaseUrl(
  params: GetBaseUrlParams = {
    removeTrailingSlash: true,
  }
) {
  let url =
    process.env.BASE_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  if (params.removeTrailingSlash && url && url.endsWith("/")) {
    url = url.substring(0, url.length - 1);
  }
  return url; // just the domain name
}

export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  ...method: string[]
) {
  if (!method.includes(req.method || "")) {
    res.status(405).json({ success: false, message: "Route not valid" });
    return false;
  }
  return true;
}

export function getIp(req: NextApiRequest | null): string {
  if (!req) return "0.0.0.0";
  const useXRealIp = process.env.USE_X_REAL_IP === "true";
  const useXForwardedFor = process.env.USE_X_FORWARDED_FOR === "true";
  const useCFConnectingIP = process.env.USE_CF_CONNECTING_IP === "true";

  return (
    (useXRealIp && req.headers["x-real-ip"]?.toString()) ||
    (useXForwardedFor && req.headers["x-forwarded-for"]?.toString()) ||
    (useCFConnectingIP && req.headers["cf-connecting-ip"]?.toString()) ||
    req.socket.remoteAddress ||
    "0.0.0.0"
  );
}

export function getIpMiddleware(req: NextRequest): string {
  const useXRealIp = process.env.USE_X_REAL_IP === "true";
  const useXForwardedFor = process.env.USE_X_FORWARDED_FOR === "true";
  const useCFConnectingIP = process.env.USE_CF_CONNECTING_IP === "true";
  return (
    (useXRealIp && req.headers.get("x-real-ip")) ||
    (useXForwardedFor && req.headers.get("x-forwarded-for")) ||
    (useCFConnectingIP && req.headers.get("cf-connecting-ip")) ||
    req.ip ||
    "0.0.0.0"
  );
}

export async function getRandomProxyString(
  overrideProxies?: string[],
  key?: string
) {
  let proxyList;
  // check if overrideProxies is set / not empty / not just [""]
  if (overrideProxies && overrideProxies.length > 0 && overrideProxies[0]) {
    proxyList = overrideProxies;
  } else {
    const proxies = await getSetting(key || "proxies", "");
    if (!proxies) return null;
    if (typeof proxies === "string") proxyList = proxies.split("\n");
    else proxyList = proxies; // assume it is an array
  }
  if (proxyList.length === 0) return null;
  return proxyList[Math.floor(Math.random() * proxyList.length)];
}

export async function getRandomProxyAgent() {
  const proxy = await getRandomProxyString();
  if (!proxy) return null;
  debug(`Using proxy: ${proxy}`);
  let agent;
  if (proxy.startsWith("socks://")) {
    agent = new SocksProxyAgent(proxy);
  } else if (proxy.startsWith("http://")) {
    agent = new HttpProxyAgent(proxy);
  } else if (proxy.startsWith("https://")) {
    agent = new HttpsProxyAgent(proxy);
  }
  return agent;
}
export async function deleteRedisKeysWithPattern(pattern: string) {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}
