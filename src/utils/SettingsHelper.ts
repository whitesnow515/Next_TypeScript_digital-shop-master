import getSettingsModel from "@models/settings";
import { getRedisClient } from "@util/RedisHolder";

export async function getSetting(key: string, defaultValue: any): Promise<any> {
  const redisClient = await getRedisClient();
  const cachedValue = await redisClient.get(`setting:${key}`);
  if (cachedValue) {
    return JSON.parse(cachedValue).value;
  }
  const SettingsModel = await getSettingsModel();
  const setting = await SettingsModel.findOne({ key });
  if (setting) {
    const { value } = setting;
    const data = {
      value,
    };
    await redisClient.set(`setting:${key}`, JSON.stringify(data));
    return value;
  }
  return defaultValue;
}

export async function setSetting(key: string, value: any): Promise<any> {
  const redisClient = await getRedisClient();
  const SettingsModel = await getSettingsModel();
  await SettingsModel.updateOne(
    { key },
    { value },
    { upsert: true, setDefaultsOnInsert: true }
  );
  const data = {
    value,
  };
  await redisClient.set(`setting:${key}`, JSON.stringify(data));
  return value;
}
