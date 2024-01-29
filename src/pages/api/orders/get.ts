import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import requireLoggedIn from "@util/AuthUtils";
import { trimAllValues } from "@util/common/string-utils";
import { error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import escapeRegExp from "@util/regex";
import { supportRoles, getHighestRole, Role } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    try {
      const {
        user,
        paid,
          sort,
        shortId,
        longId,
        paymentMethod,
        email,
        username,
        verificationQueue,
        productName, cashappNote, cryptoAddress,uniqid,search,status
      } = trimAllValues(req.query); // user id
      // get query as a string
      const queryString = req.url;
      const redisKey = `admin:orders:query:${queryString}`;
      const redisClient = await getRedisClient();
      const cached = await redisClient.get(redisKey);
      // don't cache verification queue as that is constantly changing
      // if (cached && verificationQueue !== "true") {
      //   console.log('god damn cache')
      //   res.status(200).json({
      //     success: true,
      //     ...JSON.parse(cached),
      //   });
      //   return;
      // }
      // get query params page, limit, filter
      const limit: number = parseInt(req.query.limit as string, 10) || 15;
      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit cannot be greater than 100",
        });
        return;
      }
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const before: Date = req.query.before
        ? new Date(req.query.before as string)
        : new Date();
      const after: Date = req.query.after
        ? new Date(req.query.after as string)
        : new Date(0);
      let orders: any[];
      const highest = getHighestRole(token.user.roles);
      const trialSupport = highest === Role.TRIAL_SUPPORT;
      const trialMax = trialSupport
        ? await getSetting("trialSupportMaxQueue", 50)
        : 0;
      const commonMatch = {
        timestamp: {
          $gte: after,
          $lte: before,
        },
        ...(cashappNote ? {
          'metadata.cashapp_note': cashappNote,

         } : {}),
        ...(search ? {
          $or: [
            { 'metadata.crypto_address': search.toString() },
            { 'metadata.uniqid': search.toString() },
            { _id:new ObjectId(search.toString())  },
          ]
        } : {}),
        ...(status ? {
            
           status:status.toString(),
      
        } : {}),
        
        ...(trialSupport && verificationQueue === "true"
          ? {
              originalPrice: {
                $gt: 0,
                $lte: trialMax,
              },
            }
          : {}),
        ...(user
          ? {
              user: ObjectId.isValid(user as string)
                ? new ObjectId((user as string).toLowerCase())
                : user,
            }
          : {}),
        ...(shortId ? { shortId: shortId as string } : {}),
        ...(longId
          ? {
              _id: ObjectId.isValid(longId as string)
                ? new ObjectId((longId as string).toLowerCase())
                : longId,
            }
          : {}),
        ...(paymentMethod ? { paymentMethod: paymentMethod as string } : {}),
        ...(email
          ? {
              email: {
                $regex: escapeRegExp(email as string),
                $options: "i",
              },
            }
          : {}),
        ...(username
          ? {
              username: {
                $regex: escapeRegExp(username as string),
                $options: "i",
              },
            }
          : {}),
        ...(productName
          ? {
              "subOrders.productName": {
                $regex: escapeRegExp(productName as string),
                $options: "i",
              },
            }
          : {}),
      };

      const aggregate = [
        {
          $facet: {
            search: [
              {
                $match: commonMatch,
              },
              {
                $sort: {
                  timestamp: -1,
                },
              },
              {
                $skip: page ? (page as number) * (limit as number) : 0,
              },
              {
                $limit: limit ? (limit as number) : 10,
              },
            ],
            size: [
              {
                $match: commonMatch,
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ];
      if (verificationQueue === "true") {
        const VerificationQueueModel = await getAwaitingVerificationModel();
        orders = await VerificationQueueModel.aggregate(aggregate);
      } else if (!paid || paid === "true") {
        const OrderModel = await getOrderModel();
        orders = await OrderModel.aggregate(aggregate);
      } else {
        const PendingOrderModel = await getPendingOrderModel();
        orders = await PendingOrderModel.aggregate(aggregate);
      }
      const obj = orders[0];
      if (!obj) {
        res.status(400).json({
          success: false,
          message: "No orders found",
        });
        return;
      }
      const size = obj.size[0]?.count;
      var result = obj?.search;
      const totalPages = Math.ceil(size / limit);
      if (verificationQueue !== "true") {
        await redisClient.set(
          redisKey,
          JSON.stringify({
            limit,
            page,
            totalPages,
            size,
            result,
          }),
          "EX",
          60
        );
      }
      if (sort) {
        if (sort ==="price") {

          result = result.sort(function(a:any, b:any) {
            return b.totalPrice - a.totalPrice;
          });
        }
        if (sort ==="name") {

          result = result .sort((a:any, b:any) => a.subOrders[0].productName.localeCompare(b.subOrders[0].productName.firstname))
        }
        if (sort ==="date") {

          result = result.sort((a:any,b:any)=>b.timestamp.getTime()-a.timestamp.getTime());
        }
      }
      res.status(200).json({
        success: true,
        limit,
        page,
        totalPages,
        size,
        result,
      });
    } catch (e) {
      error(e);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export default handler;
