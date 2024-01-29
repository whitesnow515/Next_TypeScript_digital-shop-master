import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import {
    cleanSensitiveProductData,
    getDefaultOption,
} from "@app-types/models/product";
import getProductModel from "@models/product";
import { getCurrentUser } from "@util/AuthUtils";
import getFeatured from "@util/common/featured";
import { log } from "@util/log";
import { getFullProductWithOptionAndStock } from "@util/products";
import { getRedisClient } from "@util/RedisHolder";
import escapeRegExp from "@util/regex";
import { hasRoles, supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (requireMethod(req, res, "GET")) {
        try {
            let productModel = await getProductModel();

            let products = await productModel.find(
                { "name": { "$regex": req.query.name, "$options": "i" } } );



            /*
            const data: ProductInterface[] = JSON.parse(
              JSON.stringify(await ProductModel.find())
            )
              .filter((product: any) => !product.hidden)
              .map((product: any) => {
                return cleanSensitiveProductData(product);
              });

            const promises = data.map(async (product: any) => {
              return getFullProductWithOptionAndStock(
                product,
                getDefaultOption(product),
                true
              );
            });
            const fullProducts = await Promise.all(promises);
            await redisClient.set(
              "products",
              JSON.stringify(fullProducts),
              "EX",
              120
            ); // 2 minutes
            res.status(200).json({
              success: true,
              data: fullProducts,
            });
             */
            res.status(200).json(products)
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
