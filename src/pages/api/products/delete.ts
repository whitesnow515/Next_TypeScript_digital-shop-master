import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getAssetManager from "@assets/AssetManagerHolder";
import { getPendingOrderModel } from "@models/order";
import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
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
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ success: false, message: "Invalid ID." });
        return;
      }
      const data = await ProductModel.findById(id.toString());
      if (!data) {
        res
          .status(400)
          .json({ success: false, message: "Could not find product." });
        return;
      }
      try {
        if (
          data.image &&
          !data.image.startsWith("http") &&
          ObjectId.isValid(data.image)
        ) {
          await getAssetManager().removeFile(data.image, "product-img");
        }
      } catch (e) {
        log(e);
        log("Continuing...");
      }
      // remove all pending orders with this product
      const PendingOrderModel = await getPendingOrderModel();
      await PendingOrderModel.deleteMany({
        "subOrders.product": new ObjectId(id.toString()),
      });
      // remove the product
      await data.remove();
      await getStockManager().removeStockProduct(id.toString());
      const SettingsModel = await getSettingsModel();
      const settingsData = await SettingsModel.findOne({
        key: "featuredProducts",
      });
      if (settingsData) {
        const featuredProducts = settingsData.value as string[];
        const index = featuredProducts.indexOf(id.toString());
        if (index !== -1) {
          featuredProducts.splice(index, 1); // remove the product
          settingsData.value = featuredProducts; // set the new value
          await settingsData.save(); // save the new value
        }
      }
      res.status(200).json({ success: true, message: "Successfully removed." });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
