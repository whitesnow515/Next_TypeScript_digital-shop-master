import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { SetStatusLog } from "@app-types/audit/order";
import { orderStatuses } from "@app-types/models/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { sendOrderModified } from "@util/discord";
import { info } from "@util/log";
import { supportRoles } from "@util/Roles";
import { getIp } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { status, id, reason } = req.body;
    /*
    if (status === "completed") {
      await setPaid(req, res);
      return;
    }
     */
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Missing reason",
      });
      return;
    }
    // check if status is in orderStatuses
    if (!orderStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status",
      });
      return;
    }
    const OrderModel = await getOrderModel();
    const query = [
      {
        _id: id,
      },
      {
        $set: {
          status,
        },
      },
    ];
    const data = await OrderModel.findOneAndUpdate(query[0], query[1]);
    info({ data });
    if (!data) {
      const PendingOrderModel = await getPendingOrderModel();
      const pendingData = await PendingOrderModel.findOneAndUpdate(
        query[0],
        query[1]
      );
      if (!pendingData) {
        res
          .status(400)
          .json({ success: false, message: "Could not find order." });
        return;
      }
    }
    const auditLog: SetStatusLog = {
      orderId: new Types.ObjectId(id),
      type: "set_status",
      status,
      reason: reason as string,
      stockAdded: false,
    };
    const performerId = token.user?._id?.toString();
    await saveAuditLog(auditLog, "order", {
      id: performerId,
      displayName: token.user?.username,
      ip: getIp(req),
    });
    await sendOrderModified(
      "Order Status Updated",
      "Status",
      status,
      data,
      token
    );
    res.status(200).json({ success: true, message: "Successfully updated." });
  } else {
    res.status(400).json({ success: false, message: "Invalid method" });
  }
}

export default handler;
