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
      if (typeof req.body.name !== "string") {
        res.status(400).json({
          success: false,
          message: "Name must be a string",
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
        finalOption.name = req.body.name as string;
        await productDocument.save();
        res.status(200).json({
          success: true,
          message: `Successfully set name to ${req.body.name}!`,
        });
      } else {
        productDocument.name = req.body.name as string;

        await productDocument.save();
        res.status(200).json({
          success: true,
          message: `Successfully set name to ${req.body.name}!`,
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
