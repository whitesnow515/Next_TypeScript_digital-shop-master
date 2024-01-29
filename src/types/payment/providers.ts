export type PaymentProviderNames = "CashApp" | "Sellix" | "Coinbase" | "Balance"| "Poof";

export type FrontendPaymentProvider = {
  name: PaymentProviderNames;
  url: string;
  imgWidth: number;
  imgHeight: number;
  roundedCorners?: boolean;
  minPrice?: number;
};

export const allPaymentProviders: FrontendPaymentProvider[] = [
  {
    name: "CashApp",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Square_Cash_app_logo.svg/1200px-Square_Cash_app_logo.svg.png",
    imgWidth: 40,
    imgHeight: 40,
    minPrice: 1,
  },
  {
    name: "Coinbase",
    url: "/assets/images/coinbase.webp",
    imgWidth: 40,
    imgHeight: 40,
    roundedCorners: true,
    minPrice: 0,
  },
];
