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
      if (typeof req.body.warranty !== "number") {
        res.status(400).json({
          success: false,
          message: "Warranty must be a number",
        });
        return;
      }
      const { option } = req.query;
      if (option) {
        const finalOption = productDocument.options.find((opt: any) => {
          return opt._id.toString() === (option as string);
        });
        if (!finalOption) {
          res.status(400).json({
            success: false,
            message: "Option not found",
          });
          return;
        }
        finalOption.warrantyHours = req.body.warranty as number;
        await productDocument.save();
        res.status(200).json({
          success: true,
          message: `Successfully set warranty!`,
        });
      } else {
        productDocument.warrantyHours = req.body.warranty as number;
        productDocument.options.forEach((opt: any) => {
          opt.warrantyHours = req.body.warranty as number;
        });
        await productDocument.save();
        res.status(200).json({
          success: true,
          message: `Successfully set warranty!`,
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
