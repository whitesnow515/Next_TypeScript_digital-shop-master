import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { getRedisClient } from "@util/RedisHolder";
import { getIp } from "@util/ServerUtils";
import { getSecondsFromUnit, TimeUnits } from "@util/TimeUnit";

export function getKey(req: NextApiRequest): string {
  const pathWithoutQuery = req.url?.split("?")[0];
  const ip = getIp(req);
  return `rate-limit:${pathWithoutQuery}:${ip}`;
}

export interface RouteOptions {
  route: string;
  failCallback: (req: NextApiRequest, res: NextApiResponse) => void;
}

export interface RateLimitOptions {
  max: number;
  window: number;
  timeUnit: TimeUnits;
  message?: string;
  affectedRoutes?: RouteOptions[];
}

const withRateLimitCfg = (
  handler: NextApiHandler,
  {
    max,
    window,
    timeUnit,
    message = "Too many requests!",
    affectedRoutes = [],
  }: RateLimitOptions
): NextApiHandler => {
  const timeUnitSeconds = getSecondsFromUnit(timeUnit, window); // Ms timeunit doesn't work
  if (timeUnitSeconds < 1) {
    throw new Error("Time unit must be at least 1 second");
  }
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const pathWithoutQuery = req.url?.split("?")[0];
    const affectedRoute = affectedRoutes.find(
      (r) => r.route === pathWithoutQuery
    );
    if (affectedRoutes.length > 0 && !affectedRoute) {
      return handler(req, res);
    }
    const key = getKey(req);
    const redisClient = await getRedisClient();
    const current = await redisClient.get(key);
    if (!current) {
      await redisClient.set(key, 1);
      await redisClient.expire(key, timeUnitSeconds);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return handler(req, res);
    }
    const currentInt = parseInt(current, 10);

    if (currentInt >= max) {
      if (affectedRoute) {
        affectedRoute.failCallback(req, res);
        return null;
      }
      res.status(429).json({
        error: true,
        rateLimit: true,
        limitRemaining: 0,
        limit: max,
        message,
      });
      return handler(req, res);
    }
    await redisClient.incr(key);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", max - currentInt - 1);
    return handler(req, res);
  };
};
const withRateLimit = (
  handler: NextApiHandler,
  max: number,
  windowSeconds: number
): NextApiHandler => {
  return withRateLimitCfg(handler, {
    max,
    window: windowSeconds,
    timeUnit: "second",
  });
};
export default withRateLimit;
export { withRateLimitCfg };
