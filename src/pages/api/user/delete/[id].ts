import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { hasAuthorityOver } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST", "DELETE")) {
    try {
      const token = await requireLoggedIn(req, res, ["admin"], true);
      if (!token) {
        return;
      }
      const UserModel = await getUserModel();

      const userId = new ObjectId(req.query.id as string);
      const data = await UserModel.findOne(userId);

      if (data) {
        // check role hierarchy
        if (!hasAuthorityOver(token.user.roles, data.roles)) {
          res.status(400).json({
            success: false,
            message:
              "You cannot delete an account with the same/higher role than you.",
          });
          return;
        }
        await data.delete();
        const OrderModel = await getOrderModel();
        await OrderModel.deleteMany({ user: userId });
        const PendingOrderModel = await getPendingOrderModel();
        await PendingOrderModel.deleteMany({ user: userId });
        const AwaitingVerificationModel = await getAwaitingVerificationModel();
        await AwaitingVerificationModel.deleteMany({ user: userId });
        res.status(200).json({
          success: true,
          message: "Successfully banned user!",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Could not find user.",
        });
      }
    } catch (err) {
      log(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
