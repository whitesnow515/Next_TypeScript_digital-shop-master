export type PullBehavior = "replace" | "append";
export type DisplayBehavior =
  | "show-purchased"
  | "show-all"
  | "show-logged-in"
  | "never";
export type ProductSortBehavior = "alphabetical" | "value" | "none";
export const productSortBehaviors: ProductSortBehavior[] = [
  "alphabetical",
  "value",
  "none",
];
