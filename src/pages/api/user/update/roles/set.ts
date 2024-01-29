import { NextApiRequest, NextApiResponse } from "next";

import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { getRole, hasAuthorityOver } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, ["admin"], true);
      if (!token) {
        return;
      }
      const UserModel = await getUserModel();

      const data: any = await UserModel.findOne({
        _id: req.body.id,
      });

      if (data) {
        if (!hasAuthorityOver(token.user.roles, data.roles)) {
          res.status(400).json({
            success: false,
            message:
              "You cannot edit the roles of someone with the same/higher role than you.",
          });
          return;
        }
        const roles: string[] = [];
        if (req.body.roles) {
          for (let i = 0; i < req.body.roles.length; i += 1) {
            const role = req.body.roles[i];
            const roleObj = getRole(role);
            if (roleObj) {
              // check if user has authority over role
              if (!hasAuthorityOver(token.user.roles, [role])) {
                res.status(400).json({
                  success: false,
                  message:
                    "You cannot modify/use a role that is the same/higher than your own.",
                });
                return;
              }
              roles.push(roleObj.name);
            }
          }
          data.roles = roles;
          await data.save();
          res.status(200).json({
            success: true,
            message: "Successfully set roles!",
          });
        } else {
          res.status(400).json({
            success: false,
            message: "No roles provided.",
          });
          return;
        }
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
