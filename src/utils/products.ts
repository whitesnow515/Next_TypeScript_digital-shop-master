import {
  FullProductInterfaceWithOption,
  getFullProductWithOption,
  ProductInterface,
  ProductOption,
  ProductOptionWithStock,
  ProductWithAllStocks,
} from "@app-types/models/product";
import getStockManager from "@util/stock/StockManagerHolder";

export async function getFullProductWithOptionAndStock(
  product: ProductInterface,
  option: ProductOption | null | undefined,
  cache = true
): Promise<FullProductInterfaceWithOption> {
  const stock: number = option // TODO: find a better way to handle this. (the stock interface in FullProductInterfaceWithOption
    ? await getStockManager().getStockAmount(
        product?._id?.toString() || "",
        option?._id?.toString() || "",
        cache
      )
    : await getStockManager().getStockAmountProduct(
        product?._id?.toString() || "",
        cache
      );
  return getFullProductWithOption(product, option, stock);
}

export async function setStocks(
  product: ProductInterface
): Promise<ProductWithAllStocks> {
  const p = JSON.parse(JSON.stringify(product));
  const { options } = p;
  const stockManager = await getStockManager();
  const newOptions: ProductOptionWithStock[] = await Promise.all(
    options.map(async (option: ProductOption) => {
      const stock = await stockManager.getStockAmount(
        p._id?.toString() || "",
        option._id?.toString() || "",
        true
      );
      return { ...option, stock };
    })
  );
  return { ...p, options: newOptions };
}
