import {
  FullProductInterfaceWithOption,
  getFullProductWithOption,
  ProductInterface,
} from "@app-types/models/product";
import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
import getStockManager from "@util/stock/StockManagerHolder";

type StockAmount = {
  productId: string;
  optionId: string;
  amount: number;
};

async function getStockAmt(
  productId: string,
  optionId: string
): Promise<StockAmount> {
  const amt = await getStockManager().getStockAmount(productId, optionId, true);
  return {
    productId,
    optionId,
    amount: amt,
  };
}

export default async function getFeatured() {
  const SettingsModel = await getSettingsModel();
  const settingsData = await SettingsModel.findOne({
    key: "featuredProducts",
  });
  if (!settingsData) {
    return [];
  }
  const { value } = settingsData;
  const featuredProducts = value as string[];
  if (!featuredProducts || featuredProducts.length === 0) {
    return [];
  }
  const ProductModel = await getProductModel();
  const data = await ProductModel.find({
    _id: { $in: featuredProducts },
  });
  const finalData: FullProductInterfaceWithOption[] = [];
  data.forEach((product: ProductInterface) => {
    if (!product.options || product.options.length <= 0 || product.hidden) {
      return;
    }
    const defaultOption = product.options.find((option: any) => option.default);
    if (defaultOption) {
      finalData.push(getFullProductWithOption(product, defaultOption));
    } else
      finalData.push(getFullProductWithOption(product, product.options[0]));
  });
  finalData.sort((a, b) => {
    return featuredProducts.indexOf(a.id) - featuredProducts.indexOf(b.id);
  });
  const promises = finalData.map(async (product) => {
    return getStockAmt(product.id, product.option?._id?.toString() || "");
  });
  const stockAmts = await Promise.all(promises);
  stockAmts.forEach((stockAmt) => {
    const product = finalData.find((p) => p.id === stockAmt.productId);
    if (!product) return;
    product.stock = stockAmt.amount;
  });
  return finalData;
}
