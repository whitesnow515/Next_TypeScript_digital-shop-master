import { mongoDbStockManager } from "@util/stock/impl/MongoDBStockManager";

import StockManager from "./StockManager";

export default function getStockManager(): StockManager {
  return mongoDbStockManager;
  /*
  if (process.env.USE_MONGO_FILE_STORAGE === "true") {
    return MongoDBStockManager;
  }
   */
}
