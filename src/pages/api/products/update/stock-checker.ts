import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";
import requireLoggedIn from "@util/AuthUtils";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    const {
      productId,
      name,
      keycheck,
      wordlisttype,
      enabled,
      proxies,
      enableAutoCheck,
      // enableAutoReplace,
    } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: "Invalid ID." });
      return;
    }
    const ProductModel = await getProductModel();
    const product = await ProductModel.findById(productId);
    if (!product) {
      res.status(400).json({ success: false, message: "Product not found!" });
      return;
    }
    if (
      typeof name !== "string" ||
      typeof keycheck !== "object" ||
      typeof wordlisttype !== "string" ||
      typeof enabled !== "boolean" ||
      typeof enableAutoCheck !== "boolean" ||
      // typeof enableAutoReplace !== "boolean"
      !Array.isArray(proxies)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid parameters",
      });
      return;
    }
    product.stockCheckerConfig = {
      name,
      keycheck,
      wordlisttype,
      enabled,
      enableAutoCheck,
      // enableAutoReplace,
      proxies,
    };
    await product.save();
    res.status(200).json({
      success: true,
      message: `Successfully set stock checker config!`,
    });
  }
}
export default handler;
