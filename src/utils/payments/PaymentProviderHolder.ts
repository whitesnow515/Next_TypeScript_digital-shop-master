import { BalanceProvider } from "@util/payments/impl/BalanceProvider";
import { CashAppProvider } from "@util/payments/impl/CashAppProvider";
import { CoinBaseProvider } from "@util/payments/impl/CoinBaseProvider";
import { PaymentProvider } from "@util/payments/PaymentProvider";
import {sellix} from "@lib/sellix";

export const cashApp = new CashAppProvider();
export const coinbase = new CoinBaseProvider();
export const balance = new BalanceProvider();
export const paymentProviders = [cashApp, coinbase, balance];

export function getPaymentProvider(
  name: string // : PaymentProviderNames - cyclic dependency
): PaymentProvider | {createInvoice: (title: string, price: number, quantity: number, email: string) => void} | null {
  switch (name) {
    case "CashApp":
      return cashApp;
    case "Coinbase":
      return coinbase;
    case "Sellix":
      return sellix;
    case "Balance":
      return balance;
    default:
      return null;
  }
}
