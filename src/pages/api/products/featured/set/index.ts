import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const SettingsModel = await getSettingsModel();
      const { products } = req.body;
      if (!products) {
        res.status(400).json({ success: false, message: "No products" });
        return;
      }
      // check for duplicate products
      const uniqueProducts = new Set(products);
      if (uniqueProducts.size !== products.length) {
        res.status(400).json({
          success: false,
          message: "There are duplicate products!",
        });
        return;
      }
      // make a db call to get the featured products to make sure they exist
      const ProductModel = await getProductModel();
      const featuredProducts = await ProductModel.find({
        _id: { $in: products },
      });
      if (featuredProducts.length !== products.length) {
        res.status(400).json({
          success: false,
          message: "At least one product does not exist!",
        });
        return;
      }
      // loop through featured products check if they contain no options
      for (const product of featuredProducts) {
        if (!product.options || product.options.length <= 0) {
          res.status(400).json({
            success: false,
            message:
              "At least one product contains no options! There must be at least one option for each product",
          });
          return;
        }
      }
      await SettingsModel.updateOne(
        { key: "featuredProducts" },
        { value: products },
        { upsert: true }
      );
      res.status(200).json({
        success: true,
        message: "Featured products updated",
      });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
