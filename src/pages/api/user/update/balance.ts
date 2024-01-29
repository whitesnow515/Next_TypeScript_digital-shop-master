import Big from "big.js";
import { ObjectId } from "bson";
import { MessageBuilder } from "discord-webhook-node";
import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";

import { UserBalChangeType, UserBalUpdateLog } from "@app-types/audit/user";
import { saveAuditLog } from "@models/audit";
import { resolveOrder } from "@models/order";
import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import sendWebhook from "@util/discord";
import { debug, error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { supportRoles, getHighestRole, Role } from "@util/Roles";
import {
  deleteRedisKeysWithPattern,
  getBaseUrl,
  getIp,
  requireMethod,
} from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import {sendMessage} from "@lib/telegram";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, supportRoles, true);
      if (!token) {
        return;
      }
      const highest = getHighestRole(token.user.roles);
      const trialSupport = highest === Role.TRIAL_SUPPORT;
      let addedToday = 0;
      if (trialSupport) {
        const redisClient = await getRedisClient();
        const addedTodayStr = await redisClient.get(
          `trial_support:balance_added:${token.user._id}`
        );
        if (addedTodayStr) {
          addedToday = parseInt(addedTodayStr || "0", 10);
          const trialSupportMaxDaily = await getSetting(
            "trialSupportMaxDaily",
            100
          );
          if (addedToday >= trialSupportMaxDaily) {
            res.status(400).json({
              success: false,
              message: "You have reached the max daily balance change limit.",
            });
            return;
          }
        }
      }

      const performerId = token.user?._id?.toString();
      const UserModel = await getUserModel();

      const data = await UserModel.findOne({
        _id: req.body.id,
      });

      if (data) {
        const { balance, reason, orderId } = req.body;
        if (balance === undefined || balance === null) {
          res.status(400).json({
            success: false,
            message: "No balance provided.",
          });
          return;
        }
        if (!reason) {
          res.status(400).json({
            success: false,
            message: "No reason provided.",
          });
          return;
        }
        if (orderId) {
          if (typeof orderId !== "string" || !ObjectId.isValid(orderId)) {
            res.status(400).json({
              success: false,
              message: "Invalid Order ID",
            });
            return;
          }
          const order = await resolveOrder(orderId);
          if (!order) {
            res.status(400).json({
              success: false,
              message: "Order not found.",
            });
            return;
          }
        }
        // check if balance is a number
        if (typeof balance !== "number") {
          res.status(400).json({
            success: false,
            message: "Balance must be a number.",
          });
          return;
        }
        const before = data.balance;
        let bal = new Big(data.balance ?? 0);
        let addedDiff = new Big(0);
        // check query for ?add=true or ?subtract=true, also use Big.js
        if (req.query.add === "true") {
          addedDiff = addedDiff.add(balance);
          debug({ addedDiff });
          bal = bal.add(balance);
        } else if (req.query.subtract === "true") {
          bal = bal.sub(balance);
        } else {
          if (bal.lt(balance)) {
            // add
            addedDiff = addedDiff.add(balance).sub(bal);
          }
          bal = new Big(balance);
        }
        // check if trial support would exceed max daily balance
        if (trialSupport) {
          const trialSupportMaxDaily = await getSetting(
            "trialSupportMaxDaily",
            100
          );
          let remaining = trialSupportMaxDaily - addedToday;
          if (remaining < 0) {
            remaining = 0;
          }
          if (addedDiff.gt(remaining)) {
            res.status(400).json({
              success: false,
              message: `You can only add $${remaining} more today.`,
            });
            return;
          }
          const redisClient = await getRedisClient();
          // should expire at midnight the next day
          const expireSeconds =
            60 * 60 * 24 -
            (Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000;
          const floor = Math.floor(expireSeconds);
          await redisClient.set(
            `trial_support:balance_added:${token.user._id}`,
            addedToday + addedDiff.toNumber(),
            "EX",
            floor
          );
        }
        data.balance = bal.toNumber();
        await data.save();
        const change: UserBalChangeType =
          req.query.add === "true"
            ? "add"
            : req.query.subtract === "true"
            ? "subtract"
            : "set";
        const auditLog: UserBalUpdateLog = {
          type: "staff_change",
          userId: data._id,
          change,
          reason,
          amount: balance,
          orderId: orderId ? new Types.ObjectId(orderId) : null,
          before,
          after: data.balance,
        };
        await deleteRedisKeysWithPattern("audit-user-*");
        await saveAuditLog(auditLog, "user", {
          id: performerId.toString(),
          displayName: token.user?.username,
          ip: getIp(req),
        });
        const url = getBaseUrl({
          removeTrailingSlash: true,
        });
        // await sendWebhook(
        //   "Balance Update",
        //   "auditWebhookUrl",
        //   new MessageBuilder()
        //     .setTitle("Balance Updated")
        //     .addField(
        //       "User",
        //       `[${data.username}](${url}/admin/users/${data._id})`,
        //       true
        //     )
        //     .addField(
        //       "Changed By",
        //       `[${token.user.username}](${url}/admin/users/${token.user._id})`,
        //       true
        //     )
        //     .addField("Change", `${change} $${balance}`, true)
        //     .addField("Current Balance", `$${data.balance}`, true)
        //     .addField("Reason", reason, false)
        // );

         sendMessage(`Balance update for ${data.username} by ${token.user.username} - ${change} $${balance} [Current Balance: $${data.balance}, Reason: ${reason}] - ${url}/admin/users/${token.user._id}`, 'audits')

        res.status(200).json({
          success: true,
          message: "Successfully updated balance!",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Could not find user.",
        });
      }
    } catch (err) {
      error(err);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
