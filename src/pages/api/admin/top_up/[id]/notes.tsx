import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import { AuditLogType } from "@app-types/audit";
import getAuditModel from "@models/audit";
import requireLoggedIn from "@util/AuthUtils";
import { error } from "@util/log";
import { getRedisClient } from "@util/RedisHolder";
import { requireMethod } from "@util/ServerUtils";
import getOrderModel from "@models/order";
import getUserModel from "@models/user";
import getTopUpOrderModel from "@models/topuporder";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (requireMethod(req, res, "POST")) {
        try {
            const token = await requireLoggedIn(req, res, ["admin"], true);
            if (!token) {
                return;
            }

            let {id} = req.query;
            let {notes} = req.body;
            let ordermodel = await getTopUpOrderModel();

            let order = await ordermodel.findOne({
                _id: id
            })
            if (!order) return res.status(400).json({
                error: true,
                message: 'Order not found'
            })

            await ordermodel.findOneAndUpdate({
                _id: id
            }, {notes: notes})
            return res.status(200).send('')
        } catch (e) {
            error(e);
            res.status(500).json({
                success: false,
                message: "Something went wrong",
            });
        }
    }
}
