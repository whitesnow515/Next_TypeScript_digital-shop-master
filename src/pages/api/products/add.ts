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
      const { name,timesBought,image,category}=req.body
        if(!name || !image){
          res.status(400).json({
            success: false,
            message: "All mandatory fields required",
          });
        }
      const data = new ProductModel({
        name: req.body.name,
        timesBought: req.body.timesBought || 0,
        image: req.body.image || "",
        category:category!=="No category selected" ? req.body.category : null,

      });
      await data.save();
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
