import { NextApiRequest, NextApiResponse } from "next";

import { ProductOption } from "@app-types/models/product";
import getProductModel from "@models/product";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, ["admin"], true);
      if (!token) {
        return;
      }
      const ProductModel = await getProductModel();
      const { productId, name, price } = req.body;
      if (!productId) {
        res.status(500).json({ success: false, message: "No product id" });
        return;
      }
      const product = await ProductModel.findById(productId as string);
      if (!product) {
        res.status(500).json({ success: false, message: "Product not found" });
        return;
      }
      if (!name) {
        res.status(500).json({ success: false, message: "No name provided" });
        return;
      }
      // check if any of product options have the same name
      const matchesName = product.options.find(
        (option: ProductOption) => option.name === (name as string)
      );
      if (matchesName) {
        res.status(500).json({
          success: false,
          message: "Option with that name already exists",
        });
        return;
      }
      const newOption: ProductOption = {
        name: name as string,
        price: price || 0,
        timesBought: 0,
        default: false,
      };
      if (product.options.length === 0) {
        newOption.default = true;
      }
      product.options.push(newOption);
      await product.save();
      res.status(201).json({
        success: true,
        message: "Option added",
      });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
