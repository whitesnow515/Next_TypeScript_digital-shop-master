import { ObjectId } from "bson";
import { MessageBuilder } from "discord-webhook-node";
import { Types } from "mongoose";

import { StockInfoInterface } from "@app-types/models/order";
import { ProductOption } from "@app-types/models/product";
import getOrderModel, { getAwaitingVerificationModel } from "@models/order";
import getProductModel from "@models/product";
import getStockModel, { getUsedStockModel } from "@models/stock";
import { PullBehavior } from "@src/types";
import sendWebhook from "@util/discord";
import { error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { getBaseUrl, getRandomProxyString } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import checkStockValidity, {
  buildNotesMessage,
  shouldSendToQueue,
} from "@util/stock/checker";
import StockManager from "@util/stock/StockManager";
import {sendMessage} from "@lib/telegram";

class MongoDBStockManager implements StockManager {
  getSomeStock(
    productId: string,
    optionId: string,
    amount: number,
    markUsed?: {
      user?: string;
      orderId?: string;
      updateStock?: boolean;
      replacement?: boolean;
      justDelete?: boolean;
    },
    options?: {
      checkValidity?: boolean;
    }
  ): Promise<{
    data: string[];
    dataId?: string;
    appendNote?: string;
    sendToApprovalQueue?: boolean;
  }> {
    return new Promise(async (resolve, reject) => {
      const StockModel = await getStockModel();
      const stock = await StockModel.findOne({
        productId,
        optionId,
      });
      if (!stock) {
        reject(new Error("Stock not found"));
        return;
      }
      const { data } = stock;
      const result: string[] = [];
      const indices: number[] = [];
      const lines = data.length;
      let i = 0;
      let index = 0;
      while (i < amount && index < data.length) {
        const item = data[index];
        // if item is an empty string, continue
        if (!item || item === "") {
          index += 1;
          continue;
        }
        result.push(item);
        indices.push(index);
        i += 1;
        index += 1;
      }
      if (i < amount) {
        // not enough stock
        reject(new Error("Not enough stock to grab new line"));
        return;
      }
      const productModel = await getProductModel();
      const product = await productModel.findOne({
        _id: new ObjectId(productId),
      });
      let dataToSave;
      if (markUsed) {
        const UsedStockModel = await getUsedStockModel();
        if (!markUsed.justDelete) {
          dataToSave = new UsedStockModel({
            _id: new ObjectId(),
            timestamp: new Date(),
            productId: stock.productId,
            optionId: stock.optionId,
            data: result,
            replacement: markUsed.replacement,
          });
          if (markUsed.orderId) {
            dataToSave.orderId = new ObjectId(markUsed.orderId);
          }
          if (markUsed.user) {
            dataToSave.user = new ObjectId(markUsed.user);
          }
          await dataToSave.save();
        }
        // remove indices from stock
        if (markUsed.updateStock || markUsed.justDelete) {
          stock.data = stock.data.filter((_: any, ind: number) => {
            if (indices.length === 0) {
              return true;
            }
            const bool = !indices.includes(ind);
            if (!bool) {
              // remove from indices
              indices.splice(indices.indexOf(ind), 1);
            }
            return bool;
          });
          const option = product.options.find(
            (opt: ProductOption) => opt._id?.toString() === optionId
          );
          option.totalStockLines = lines;
          product.totalStockLines = product.options.reduce(
            (a: number, b: ProductOption) => {
              return a + (b.totalStockLines || 0);
            },
            0
          );
          await product.save();
          const { length } = stock.data;
          if (
            length === 0 ||
            (option?.stockLines && length <= option.stockLines)
          ) {
            try {
              if (option) {
                sendMessage(`Option ${option.name} from ${product.name} has gone out of stock - ${getBaseUrl({removeTrailingSlash: true,})}/admin/products/${productId}/options/${optionId}/stock/`, 'audits')
                //
                // await sendWebhook(
                //   "Stock Notifications",
                //   "outOfStockWebhookUrl",
                //   new MessageBuilder()
                //     .setTitle("Out of stock")
                //     .addField("Product", product.name, true)
                //     .addField("Option", option.name, true)
                //     .addField("Lines left", length, true)
                //     .addField("Stock lines", option.stockLines, true)
                //     .addField(
                //       "Link",
                //       `[Click Here](${getBaseUrl({
                //         removeTrailingSlash: true,
                //       })}/admin/products/${productId}/options/${optionId}/stock/)`,
                //       true
                //     )
                //     .setText("@everyone")
                //     .setTimestamp()
                // );
              }
            } catch (e) {
              error("Failed to send webhook", e);
            }
          }
        }
        await stock.save();
        // clear cache
        const redisClient = await getRedisClient();
        await redisClient.del(
          `cache:stock:${productId}:${optionId}:amount`,
          `cache:stock:${productId}:amount`
        );
        // resolve({ data: result, dataId: dataToSave?._id?.toString() });
      }
      if (options) {
        if (options.checkValidity) {
          const maxErrorRetries = await getSetting("maxErrorRetries", 3);
          const cfg = product.stockCheckerConfig;
          delete cfg.enabled;
          delete cfg.enableAutoReplace;
          const { proxies } = cfg;
          delete cfg.proxies;

          const response = await checkStockValidity({
            ...cfg,
            proxy: await getRandomProxyString(proxies, "stockCheckerProxies"),
            maxRetries: maxErrorRetries,
            data: result,
          });
          const note = buildNotesMessage(response);

          resolve({
            data: result,
            appendNote: note,
            sendToApprovalQueue: shouldSendToQueue(response),
            dataId: dataToSave?._id?.toString(),
          });
        }
      }
      resolve({ data: result, dataId: dataToSave?._id?.toString() });
    });
  }

  getStock(productId: string, optionId: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      const StockModel = await getStockModel();
      const stock = await StockModel.findOne({
        productId,
        optionId,
      });
      if (!stock) {
        reject(new Error("Stock not found"));
        return;
      }
      resolve(stock.data);
    });
  }

  getStockAmount(
    productId: string,
    optionId: string,
    cache?: boolean
  ): Promise<number> {
    return new Promise(async (resolve) => {
      const redisClient = await getRedisClient();
      if (cache) {
        const data = await redisClient.get(
          `cache:stock:${productId}:${optionId}:amount`
        );
        if (data) {
          resolve(parseInt(data, 10));
          return;
        }
      }
      const StockModel = await getStockModel();
      const data = await StockModel.aggregate([
        {
          $match: {
            productId: new ObjectId(productId),
            optionId: new ObjectId(optionId),
          },
        },
        {
          $project: {
            data: {
              $size: "$data",
            },
          },
        },
      ]);
      if (!data || data.length === 0) {
        // reject(new Error("Stock not found"));
        resolve(0);
        return;
      }
      const d = data[0].data;
      let final = d;
      const ProductModel = await getProductModel();
      const productData = await ProductModel.findById(productId);
      const option = productData?.options.find(
        (opt: ProductOption) => opt._id?.toString() === optionId
      );
      if (option) {
        final = Math.floor(d / option.stockLines); // divide lines by the lines to distribute per unit
        let save = false;
        if (option.totalStockLines !== d) {
          save = true;
          option.totalStockLines = d;
        }
        // add up all the stock lines for every option
        const expected = productData?.options.reduce(
          (a: number, b: ProductOption) => {
            return a + (b.totalStockLines || 0);
          },
          0
        );
        if (expected !== productData?.totalStockLines) {
          save = true;
          productData.totalStockLines = expected;
        }
        if (save) {
          await productData?.save();
        }
      }
      if (cache) {
        await redisClient.set(
          `cache:stock:${productId}:${optionId}:amount`,
          final
        );
        await redisClient.expire(
          `cache:stock:${productId}:${optionId}:amount`,
          120
        );
      }
      resolve(final);
    });
  }

  getStockAmountProduct(productId: string, cache?: boolean): Promise<number> {
    return new Promise(async (resolve) => {
      const redisClient = await getRedisClient();
      if (cache) {
        const data = await redisClient.get(`cache:stock:${productId}:amount`);
        if (data) {
          resolve(parseInt(data, 10));
          return;
        }
      }
      /*
      const StockModel = await getStockModel();
      const data = await StockModel.aggregate([
        {
          $match: {
            productId: new ObjectId(productId),
          },
        },
        {
          $group: {
            _id: "$productId",
            total: {
              $sum: {
                $size: "$data",
              },
            },
          },
        },
      ]);
      if (!data || data.length === 0) {
        // reject(new Error("Stock not found"));
        resolve(0);
        return;
      }
      debug(data);
      resolve(data[0].total);
       */
      const ProductModel = await getProductModel();
      const productData = await ProductModel.findById(productId);
      if (!productData) {
        resolve(0);
        return;
      }
      const promises = productData.options.map(
        async (option: ProductOption) => {
          const amount = await this.getStockAmount(
            productId,
            option._id?.toString() || "",
            false
          );
          return amount;
        }
      );
      const data = await Promise.all(promises);
      const total = Math.floor(data.reduce((a, b) => a + b, 0));
      if (cache) {
        await redisClient.set(`cache:stock:${productId}:amount`, total);
        await redisClient.expire(`cache:stock:${productId}:amount`, 120);
      }
      resolve(total);
    });
  }

  saveStock(
    productId: string,
    optionId: string,
    stock: string[],
    behavior?: PullBehavior
  ): Promise<void> {
    return new Promise(async (resolve) => {
      const StockModel = await getStockModel();
      let stockData = await StockModel.findOne({
        productId,
        optionId,
      });
      let exists = true;
      if (!stockData) {
        exists = false;
        stockData = new StockModel({
          productId,
          optionId,
        });
      }
      stock = stock.filter((item) => item !== "");
      if (behavior === "replace") {
        stockData.data = stock;
      } else if (behavior === "append") {
        stockData.data = [...stockData.data, ...stock];
      }
      if (!exists) await stockData.save();
      else await stockData.updateOne(stockData);
      const ProductModel = await getProductModel();
      const product = await ProductModel.findById(productId);
      const option = product?.options?.find(
        (opt: ProductOption) => opt._id?.toString() === optionId
      );
      if (option) {
        option.totalStockLines = stockData.data.length;
        product.totalStockLines = product.options.reduce(
          (a: number, b: ProductOption) => {
            return a + (b.totalStockLines || 0);
          },
          0
        );
        product.lastStocked = new Date();
        await product.save();
      }
      const redisClient = await getRedisClient();
      await redisClient.del(
        `cache:stock:${productId}:${optionId}:amount`,
        `cache:stock:${productId}:amount`
      );
      resolve();
    });
  }

  removeStockProduct(productId: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const StockModel = await getStockModel();
      await StockModel.deleteMany({
        productId,
      });
      resolve();
    });
  }

  removeStockOption(productId: string, optionId: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const StockModel = await getStockModel();
      await StockModel.deleteMany({
        productId,
        optionId,
      });
      resolve();
    });
  }

  removeStockOrder(orderId: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const UsedStockModel = await getUsedStockModel();
      await UsedStockModel.deleteMany({
        orderId,
      });
      resolve();
    });
  }

  markStocksUnused(stockIds: string[]): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const UsedStockModel = await getUsedStockModel();
      await UsedStockModel.deleteMany({
        _id: {
          $in: stockIds,
        },
      });
      resolve();
    });
  }

  saveReplacement(
    data: string[] | null,
    orderId: string,
    userId: string,
    product: { id: string; option: string; subOrderId: string; pull?: boolean; pullAmount?: number }
  ): Promise<string | undefined> {
    return new Promise<string | undefined>(async (resolve, reject) => {
      const OrderModel = await getOrderModel();
      let order = await OrderModel.findById(orderId);
      if (!order) {
        const AwaitingModel = await getAwaitingVerificationModel();
        order = await AwaitingModel.findById(orderId);
        if (!order) {
          resolve(undefined);
          return;
        }
      }
      if (product.pull) {
        const subOrder = order.subOrders.find((x:any) => x._id.toString() ===product.subOrderId);
        const pullLines = product.pullAmount || (subOrder.stockLines as number);
        // const productModel = await getProductModel();
        // const productData = await productModel.findOne({
        //   _id: new ObjectId(product.id),
        // });
        try {
          await this.getSomeStock(
            product.id,
            product.option,
            pullLines,
            {
              user: userId,
              orderId,
              updateStock: true,
              replacement: true,
            },
            {
              checkValidity: false, // productData?.stockCheckerConfig?.enabled ?? false,
            }
          )
            .catch((err) => {
              reject(err);
            })
            .then(async (result) => {
              if (result?.dataId) {
                const { stocks } = order.subOrders.find((x:any) => x._id.toString() ===product.subOrderId);
                const stockInfo: StockInfoInterface = {
                  id: new Types.ObjectId(result.dataId as string), // whatever
                  replacement: true,
                };
                stocks.push(stockInfo);
                await order.updateOne(order);
                resolve(result.dataId);
                return;
              }
              resolve(undefined);
            });
        } catch (e: any) {
          reject(e);
        }
        return;
      }
      const UsedStockModel = await getUsedStockModel();
      const dataToSave = new UsedStockModel({
        orderId: new ObjectId(orderId),
        timestamp: new Date(),
        productId: product.id,
        optionId: product.option,
        data,
        replacement: true,
      });
      if (userId) {
        dataToSave.user = new ObjectId(userId);
      }
      await dataToSave.save();
      const { stocks } = order.subOrders[0];
      const stockInfo: StockInfoInterface = {
        id: dataToSave._id,
        replacement: true,
        lastAccessed:new Date()
      };
      stocks.push(stockInfo);
      await order.updateOne(order);
      resolve(dataToSave._id.toString());
    });
  }

  removeReplacements(ids: string[]): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const UsedStockModel = await getUsedStockModel();
      await UsedStockModel.deleteMany({
        _id: {
          $in: ids,
        },
      });
      resolve();
    });
  }

  dropUsedStocks(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const UsedStockModel = await getUsedStockModel();
      await UsedStockModel.collection.drop();
      resolve();
    });
  }
}

export const mongoDbStockManager = new MongoDBStockManager();
