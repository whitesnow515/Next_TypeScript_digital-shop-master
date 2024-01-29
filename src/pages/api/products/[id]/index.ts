import { NextApiRequest, NextApiResponse } from "next";

import getFeatured from "@util/common/featured";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";
import {z} from'zod'
import getProductModel from "@models/product";
import {ObjectId} from "mongodb";
const form = z.object({
    minimum: z.number().nullable().optional(),
    maximum: z.number().nullable().optional(),
    category: z.string().optional(),

})

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requireMethod(req, res, "POST")) {
        try {
            const data = await form.parseAsync(req.body)

            const { id } = req.query;
            if (!id || id === "undefined") {
                res.status(400).json({
                    success: false,
                    message: "No id provided",
                });
                return;
            }

            const ProductModel = await getProductModel();
            const updatedProduct = await ProductModel.findOneAndUpdate({
                _id: new ObjectId(id as any)
            }, data, {
                returnOriginal: false
            })
            res.status(200).json({
                success: true,
                data: updatedProduct,
            });
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
