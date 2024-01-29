const sdkCreateInvoice = require("api")("@poof/v1.0#3nao06fldv08mh9");

const sdkGetPayment = require("api")("@poof/v1.0#1hlpy42lb337rhp");
const sdkGetTransaction = require("api")("@poof/v1.0#3rz4rpi17lim2hthu");
const authorizationKey = process.env.POOF_AUTH_KEY;
const sdkCashAppInvoice = require("api")("@poof/v1.0#1xuax3al9rvy9fw");

const GetPaymentInfo = async (paymentId: string) => {
  try {
    const paymentInfo = await sdkGetPayment.fetchTransaction(
      { transaction: paymentId },
      {
        authorization: authorizationKey,
      }
    );
    // GetTransaction(paymentId)
    return paymentInfo.data;
  } catch (err) {
    console.error(err, "Error");
  }
};

const CreateInvoice = async (
  price: number,
  currency: string,
  items?: any,
  email?: any
) => {
  try {
    const orderItmes = items.filter((data: any) => data.optionId);
    const invoice =
      currency === "cashapp"
        ? await sdkCashAppInvoice.createInvoice(
            {
              payment: currency,
              amount: price.toString(),
              currency: "usd",
              metadata: {
                order_info: (orderItmes && orderItmes) || [],
              },
              email,
              success_url: "https://www.poof.io/success",
              redirect_url: "https://www.poof.io",
            },
            {
              authorization: authorizationKey,
            }
          )
        : await sdkCreateInvoice.createInvoice(
            {
              amount: price.toString(),
              metadata: {
                order_info: orderItmes,
              },
              // email:order.email,
              // name:order.username,
              crypto: currency,
              redirect_url: "https://www.poof.io",
              success_url: "https://www.poof.io/success",
            },
            {
              authorization: authorizationKey,
              // 'RPvSmc2hQmSoJnbVpfuvvA'
            }
          );
    
    return invoice.data;
  } catch (err) {
    console.error(err, "Error");
  }
};

const GetTransaction = async (paymentId: string) => {
  try {
    const transactionInfo = await sdkGetTransaction.postApiV2Transfer_status(
      { transaction: paymentId },
      {
        authorization: authorizationKey,
        // 'RPvSmc2hQmSoJnbVpfuvvA'
      }
    );
    //   DJ5PiPlB-OnpXUT4jAUn6A
    return transactionInfo.data;
  } catch (err) {
    console.error(err, "Error");
  }
};

export const poof = {
  createInvoice: CreateInvoice,
  getPaymentInfo: GetPaymentInfo,
  getTransactionInfo: GetTransaction,
};
