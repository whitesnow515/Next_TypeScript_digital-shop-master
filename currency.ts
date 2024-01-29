 export const currency = [
  {
    coin: "BTC",
    logo: "/assets/images/btc-logo.svg",
    value: "BITCOIN",
  },
  {
    coin: "LTC",
    logo: "/assets/images/ltc-logo.svg",
    value: "LITECOIN",
  },
  {
    coin: "ETH",
    logo: "/assets/images/ethereum-logo.svg",
    value: "ETHEREUM",
  },
  {
    coin: "DOGE",
    logo: "/assets/images/doge-logo.svg",
    value: "DOGE",
  },
  {
    coin: "BCH",
    logo: "/assets/images/bch-logo.svg",
    value: "BITCOIN_CASH",
  },
  {
    coin: "USDC",
    logo: "/assets/images/usdc-logo.svg",
    value: "USDC:ERC20",
  },
  {
    coin: "CASH APP",
    logo: "/assets/images/cashapp.png",
    value: "CASH_APP",
  },
];

 export const failStatus=[
  "PARTIAL",
  "VOIDED",
  "REFUNDED",
  "PAYMENT_CAPTURE_REFUNDED",
  "PAYMENT_CAPTURE_REVERSED",
  "PAYMENT_CAPTURE_DENIED",
  "PAYMENT_AUTHORIZATION_VOIDED",
  "REVERSED"
 ] 

 export const pendingStatus=[
  "PENDING", 
  "WAITING_FOR_CONFIRMATIONS", 
  "PAYMENT_CAPTURE_PENDING"
 ] 

 export const completeStatus=[
  "COMPLETED",
  "PAYMENT_CAPTURE_COMPLETED",
  "CHECKOUT_ORDER_COMPLETED",
  "CHECKOUT_ORDER_APPROVED"
 ]