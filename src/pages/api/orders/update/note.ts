import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { OrderNoteChangeLog } from "@app-types/audit/order";
import { saveAuditLog } from "@models/audit";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { supportRoles } from "@util/Roles";
import { getIp } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    const { note, id } = req.body;
    const OrderModel = await getOrderModel();

    // Retrieve the before and after strings for the notes
    const query = [
      {
        _id: id,
      },
      {
        $set: {
          notes: note,
        },
      },
      {
        new: false, // Return the updated document
      },
    ];

    const data = await OrderModel.findOneAndUpdate(...query);

    if (!data) {
      const PendingOrderModel = await getPendingOrderModel();
      const pendingData = await PendingOrderModel.findOneAndUpdate(...query);

      if (!pendingData) {
        res
          .status(400)
          .json({ success: false, message: "Could not find order." });
        return;
      }
    }

    const beforeNotes = data ? data.notes : "";
    const afterNotes = note;

    const auditData: OrderNoteChangeLog = {
      orderId: new Types.ObjectId(id),
      before: beforeNotes,
      after: afterNotes,
      type: "note_change",
    };
    await saveAuditLog(auditData, "order", {
      id: token.user?._id?.toString(),
      displayName: token.user?.username,
      ip: getIp(req),
    });
    res.status(200).json({
      success: true,
      message: "Successfully updated.",
      beforeNotes,
      afterNotes,
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid method" });
  }
}

export default handler;
