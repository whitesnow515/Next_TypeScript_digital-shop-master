import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getStockModel from "@models/stock";
import requireLoggedIn from "@util/AuthUtils";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, ["admin"]);
    if (!token) {
      return;
    }
    const { id, optionId } = req.query; // product id, option id
    if (
      !id ||
      typeof id !== "string" ||
      !ObjectId.isValid(id) ||
      !optionId ||
      typeof optionId !== "string" ||
      !ObjectId.isValid(optionId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid stock id",
      });
      return;
    }
    const StockModel = await getStockModel();
    const stock = await StockModel.findOne({
      productId: new ObjectId(id as string),
      optionId: new ObjectId(optionId as string),
    });
    if (!stock) {
      res.status(404).json({
        success: false,
        noStock: true,
        message: "Stock not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: stock,
    });
  }
}
export const config = {
  api: {
    responseLimit: "16mb",
  },
};
