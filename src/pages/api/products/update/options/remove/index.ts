import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    try {
      const token = await requireLoggedIn(req, res, ["admin"], true);
      if (!token) {
        return;
      }
      const ProductModel = await getProductModel();
      const { productId, optionId } = req.body;
      if (
        !productId ||
        !optionId ||
        productId.length !== 24 ||
        optionId.length !== 24
      ) {
        res.status(400).json({ success: false, message: "Invalid ID(s)." });
        return;
      }
      const data = await ProductModel.findById(productId.toString());
      if (!data) {
        res
          .status(400)
          .json({ success: false, message: "Could not find product." });
        return;
      }
      const { options } = data;
      // check if option exists
      const option = options.find((opt: any) => {
        return opt._id.toString() === optionId.toString();
      });
      if (!option) {
        res.status(400).json({ success: false, message: "Option not found." });
        return;
      }
      const isDefault = option.default;
      // remove option
      const newOptions = options.filter((opt: any) => {
        return opt._id.toString() !== optionId.toString();
      });
      if (isDefault) {
        // set new default
        if (newOptions.length > 0) {
          newOptions[0].default = true;
        }
      }
      data.options = newOptions;
      await data.save();
      // remove all pending orders with this product
      const PendingOrderModel = await getPendingOrderModel();
      await PendingOrderModel.deleteMany({
        "subOrders.productOptionId": new ObjectId(optionId.toString()),
      });
      await getStockManager().removeStockOption(
        productId.toString(),
        optionId.toString()
      );
      res.status(200).json({ success: true, message: "Successfully removed." });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
