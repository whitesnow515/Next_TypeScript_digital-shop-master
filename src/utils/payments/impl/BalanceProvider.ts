import { OrderInterface } from "@app-types/models/order";
import { UserInterface } from "@app-types/models/user";
import { PaymentProvider } from "@util/payments/PaymentProvider";

export class BalanceProvider implements PaymentProvider {
  name = "Balance";

  iconUrl = "";

  createPayment(
    order: OrderInterface,
    user: UserInterface | null
  ): Promise<string> {
    return Promise.resolve(`/pay/success/?orderId=${order._id}`);
  }

  verifyPayment(
    paymentId: string,
    amount: number
  ): Promise<{ success: boolean; awaitingAccept?: boolean }> {
    return Promise.resolve({ success: true });
  }
}
