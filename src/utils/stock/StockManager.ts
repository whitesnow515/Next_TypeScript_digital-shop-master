import { PullBehavior } from "@src/types";

interface StockManager {
  getStockAmountProduct(productId: string, cache?: boolean): Promise<number>;

  getStockAmount(
    productId: string,
    optionId: string,
    cache?: boolean
  ): Promise<number>;

  getStock(productId: string, optionId: string): Promise<string[]>;

  getSomeStock(
    productId: string,
    optionId: string,
    amount: number,
    markUsed?: {
      user: string;
      orderId: string;
      updateStock?: boolean;
      replacement?: boolean;
    },
    options?: {
      checkValidity?: boolean;
    }
  ): Promise<{
    data: string[];
    dataId?: string;
    appendNote?: string;
    sendToApprovalQueue?: boolean;
  }>;

  saveStock(
    productId: string,
    optionId: string,
    stock: string[],
    behavior?: PullBehavior
  ): Promise<void>;

  removeStockProduct(productId: string): Promise<void>;

  removeStockOption(productId: string, optionId: string): Promise<void>;

  removeStockOrder(orderId: string): Promise<void>;

  markStocksUnused(stockIds: string[]): Promise<void>;

  saveReplacement(
    data: string[] | null,
    orderId: string,
    userId: string | null,
    product: { id: string; option: string; subOrderId: string; pull?: boolean; pullAmount?: number }
  ): Promise<string | undefined>;

  removeReplacements(ids: string[]): Promise<void>;

  dropUsedStocks(): Promise<void>;
}

export default StockManager;
