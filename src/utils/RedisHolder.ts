import Redis from "ioredis";

import { debug, error, log } from "@util/log";

export async function connectRedis() {
  const connectionStr = process.env.REDIS_URI;
  if (!connectionStr) {
    throw new Error("No redis connection string");
  }
  const redis = new Redis(connectionStr);
  redis.on("error", (err) => {
    error(err);
  });
  redis.on("connect", () => {
    log("Redis connected");
  });
  redis.on("ready", () => {
    log("Redis ready");
  });
  redis.on("reconnecting", () => {
    log("Redis reconnecting");
  });
  redis.on("end", () => {
    log("Redis ended");
  });
  redis.on("warning", (err) => {
    error(err);
  });
  debug("Creating new redis client");
  return redis;
}

export async function getRedisClient(): Promise<Redis> {
  // @ts-ignore
  if (global.redisClient) {
    // @ts-ignore
    return global.redisClient;
  }
  const redisClient = await connectRedis();
  // @ts-ignore
  global.redisClient = redisClient;
  // @ts-ignore
  return redisClient;
}
