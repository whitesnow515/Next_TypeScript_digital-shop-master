import { OrderInterface } from "@app-types/models/order";
import { UserInterface } from "@app-types/models/user";

export interface PaymentProvider {
  name: string;
  iconUrl: string;

  createPayment(
    order: OrderInterface,
    user: UserInterface | null
  ): Promise<string>;

  verifyPayment(
    paymentId: string,
    amount: number
  ): Promise<{
    success: boolean;
    awaitingAccept?: boolean;
  }>;
}
