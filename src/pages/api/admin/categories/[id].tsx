import { NextApiRequest, NextApiResponse } from "next";

import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";
import { setSetting } from "@util/SettingsHelper";
import {getProductCategoryModel} from "@models/product";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requireMethod(req, res, "POST")) {
        const token = await requireLoggedIn(req, res, ["admin"], true);
        if (!token) {
            return;
        }
        try {
            const { id: category } = req.query;

            let categoryM= await getProductCategoryModel()
            await categoryM.deleteOne({
                _id: category
            })
            res.status(200).json({
                success: true,
                message: "Removed category",
            });
        } catch (err) {
            log(err);
            res.status(500).json({ success: false, message: "Something went wrong" });
        }
    }
}

export default handler;
