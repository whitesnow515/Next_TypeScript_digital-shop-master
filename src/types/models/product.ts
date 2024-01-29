import { Types } from "mongoose";

import { ProductSortBehavior } from "@src/types";

export interface ProductOption {
  _id?: Types.ObjectId;
  name: string;
  price: number;
  timesBought?: number;
  default?: boolean;
  warrantyEnabled?: boolean;
  warrantyHours?: number;
  holdAllOrders?: boolean;
  stockLines?: number;
  hidden?: boolean;
  totalStockLines?: number;
}

export interface ProductOptionWithStock extends ProductOption {
  stock: number;
}

export interface StockCheckerConfig {
  enabled: boolean;
  enableAutoCheck: boolean;
  enableAutoReplace: boolean;
  name: string;
  keycheck: any;
  wordlisttype: string;
  proxies?: string[];
}

export interface ProductInterface {
  _id?: Types.ObjectId;
  __v?: string;
  name: string;
  image: string | undefined;
  bannerImage: string | undefined;
  fitBanner: boolean | false;
  timesBought: number;
  options: ProductOption[];
  description?: string; // Markdown
  shortDescription?: string;
  warrantyEnabled?: boolean;
  warrantyHours?: number;
  holdAllOrders?: boolean;
  note?: string;
  sort?: ProductSortBehavior;
  hidden?: boolean;
  lastStocked?: Date;
  totalStockLines?: number;
  stockCheckerConfig?: StockCheckerConfig;
}

export interface ProductInterfaceWithStock extends ProductInterface {
  stock: number;
}

export interface FullProductInterfaceWithOption extends ProductInterface {
  id: string;
  option?: ProductOption | null;
  price: number;
  default?: boolean;
  stock?: number;
}

export interface ProductWithAllStocks extends ProductInterface {
  options: ProductOptionWithStock[];
}

export function getFullProductWithOption( // god i wish there were overloads in typescript
  product: ProductInterface,
  option: ProductOption | null | undefined,
  stock = -1
): FullProductInterfaceWithOption {
  const hasOption = !!option;
  let warrantyEnabled: boolean = false;
  let warrantyHours: number = -1;
  if (hasOption) {
    const we = option?.warrantyEnabled && product.warrantyEnabled;
    warrantyEnabled = !!we;
    const wh = option?.warrantyHours || product.warrantyHours;
    if (wh) warrantyHours = wh; // thanks, typescript
    else warrantyHours = -1;
  }
  const c: FullProductInterfaceWithOption = {
    // TODO use spread operator or something
    id: product._id?.toString() || "",
    _id: product._id,
    options: product.options,
    name: product.name,
    image: product.image,
    bannerImage: product.bannerImage,
    timesBought: product.timesBought,
    option: hasOption ? option : null,
    price: hasOption ? option.price : -1,
    default: option?.default || true,
    description: product.description,
    fitBanner: product.fitBanner,
    shortDescription: product.shortDescription,
    warrantyEnabled,
    warrantyHours,
    totalStockLines: product.totalStockLines,
    lastStocked: product.lastStocked,
    // @ts-ignore
    category: product.category
  };
  if (stock && stock > 0) {
    c.stock = stock;
  }
  return c;
}

export function getDefaultOption(
  product: ProductInterface
): ProductOption | undefined {
  if (product.options.length === 0) return undefined;
  return (
    product.options.find((option: any) => option.default) || product.options[0]
  );
}

export function getFullProductWithOptionsDefaultArr(
  products: ProductInterface[]
): FullProductInterfaceWithOption[] {
  return products.map((product: any) => {
    if (product.options.length === 0)
      return getFullProductWithOption(product, null);
    const defaultOption = product.options.find((option: any) => option.default);
    if (defaultOption) {
      return getFullProductWithOption(product, defaultOption);
    }
    return getFullProductWithOption(product, product.options[0]);
  });
}

export function cleanSensitiveOptionData(option: any) {
  if (!option) return option;
  const o = JSON.parse(JSON.stringify(option));
  delete o.timesBought;
  return o;
}

export function cleanSensitiveProductData(product: any) {
  if (!product) return product;
  // remove notes, timesBought
  const p = JSON.parse(JSON.stringify(product));
  delete p.note;
  delete p.timesBought;
  delete p.stockCheckerConfig;
  // remove timesBought from options
  p.options = p.options.map((option: any) => {

    return cleanSensitiveOptionData(option);
  });
  return p;
}
