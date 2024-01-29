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
      const { id, defaultOption } = req.body;
      if (!id) {
        res.status(500).json({ success: false, message: "No product id" });
        return;
      }
      if (!defaultOption) {
        res.status(500).json({ success: false, message: "No option provided" });
        return;
      }
      const product = await ProductModel.findById(id as string);
      if (!product) {
        res.status(500).json({ success: false, message: "Product not found" });
        return;
      }
      const option = product.options.find(
        (opt: ProductOption) =>
          opt?._id?.toString() === (defaultOption as string)
      );
      if (!option) {
        res.status(500).json({ success: false, message: "Option not found" });
        return;
      }
      product.options.forEach((opt: ProductOption) => {
        opt.default = false;
      });
      option.default = true;
      await product.save();
      res.status(200).json({
        success: true,
        message: `Option '${option.name}' set as default`,
      });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
