import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const ProductModel = await getProductModel();

      const { id } = req.query;
      if (!id || id === "undefined") {
        res.status(400).json({
          success: false,
          message: "No id provided",
        });
        return;
      }
      const data = await ProductModel.findById(id as string);
      data.__v = undefined;
      data.timesBought = undefined;

      res.status(200).json({
        success: true,
        data,
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
