import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

import { ProductOption } from "@app-types/models/product";
import getProductModel from "@models/product";
import { PullBehavior } from "@src/types";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";
import getStockManager from "@util/stock/StockManagerHolder";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    try {
      const ProductModel = await getProductModel();
      const { productId, optionId } = req.query;
      const product = await ProductModel.findById(productId as string);
      if (!product) {
        res.status(400).json({ error: true, message: "Invalid product" });
        return;
      }
      const option = product.options.find(
        (o: ProductOption) => o._id?.toString() === (optionId as string)
      );
      if (!option) {
        res.status(400).json({ error: true, message: "Invalid option" });
        return;
      }
      let data: string[] = [];
      const { pull } = req.query;
      if (typeof req.body.data === "string" && pull === "true") {
        // pull data from url with axios
        try {
          const url = req.body.data;
          const response = await axios.get(url);
          data = response.data.split("\n") as string[];
        } catch (e) {
          log(e);
          res.status(400).json({ error: true, message: `Returned error ${e}` });
          return;
        }
      } else if (Array.isArray(req.body.data)) {
        data = req.body.data;
      }
      // clean up data, remove empty lines and trim
      data = data.filter((d) => d.trim() !== "").map((d) => d.trim());
      const { behavior } = req.body;
      // check if behavior aligns with the PullBehavior type
      if (behavior !== "replace" && behavior !== "append") {
        res.status(400).json({ error: true, message: "Invalid behavior" });
        return;
      }
      await getStockManager().saveStock(
        productId as string,
        optionId as string,
        data,
        behavior as PullBehavior
      );
      res.status(201).json({
        success: true,
        message: "Saved!",
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
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};
