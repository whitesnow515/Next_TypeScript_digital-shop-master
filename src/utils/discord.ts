import { MessageBuilder, Webhook } from "discord-webhook-node";

import { OrderInterface, SubOrderInterface } from "@app-types/models/order";
import { debug } from "@util/log";
import { getBaseUrl } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import {sendMessage} from "@lib/telegram";

const sendWebhook = async (
  avatarName: string,
  settingKey: string,
  message: MessageBuilder
) => {
  const url = await getSetting(settingKey, "");
  if (!url) {
    debug("URL is null!");
    return;
  }
  const webhook = new Webhook(url);
  const avatar = `${getBaseUrl({
    removeTrailingSlash: true,
  })}/favicon-32x32.png`;
  debug("Sending webhook");
  await webhook.send(
    message.setColor(0xff8c00).setTimestamp().setAuthor(avatarName, avatar)
  );


};
export const sendOrderModified = async (
  title: string,
  key: string | null,
  value: any | null,
  order: OrderInterface,
  token: any
) => {
  const orderData = (order as any).subOrders[0] as SubOrderInterface;
  const url = getBaseUrl({
    removeTrailingSlash: true,
  });
  ('order data: ', orderData)
  const mb = new MessageBuilder()
    .setTitle(title)
    .addField(
      "Order",
      `[${orderData.productQuantity}x ${
        orderData.productName
      }](${url}/admin/orders/${order._id?.toString()}))`,
      false
    )
    .addField(
      "Updated By",
      `[${
        token.user.username
      }](${url}/admin/users/${token.user._id.toString()}/)`,
      true
    );
  if (key && value) {
    mb.addField(key, value, true);
  }

  await sendMessage(`Order [${orderData.productQuantity}x ${
      orderData.productName
  }](${url}/admin/orders/${order._id?.toString()})) has been updated by ${token.user.username}/${token.user._id.toString()}`, 'audit')

 // await sendWebhook("Order Modification", "auditWebhookUrl", mb);
};
export default sendWebhook;
