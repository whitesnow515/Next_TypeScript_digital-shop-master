import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";
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
      const ProductModel = await getProductModel();

      const productDocument = await ProductModel.findOne({ _id: req.body.id });
      if (!productDocument) {
        res.status(400).json({ success: false, message: "Invalid ID." });
        return;
      }
      // check if req.body.price is a number
      if (typeof req.body.price !== "number") {
        res.status(400).json({
          success: false,
          message: "Price must be a number",
        });
        return;
      }
      const { id } = req.query;
      if (id) {
        const finalOption = productDocument.options.find((opt: any) => {
          return opt._id.toString() === (id as string);
        });
        if (!finalOption) {
          res.status(400).json({
            success: false,
            message: "Option not found",
          });
          return;
        }
        finalOption.price = req.body.price as number;
        await productDocument.save();
        res.status(200).json({
          success: true,
          message: `Successfully set price to ${req.body.price}!`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Option not found",
        });
      }
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
