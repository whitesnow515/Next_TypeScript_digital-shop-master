import { NextApiRequest, NextApiResponse } from "next";

import { resolveOrder } from "@models/order";
import getProductModel from "@models/product";
import getStockModel, { getUsedStockModel } from "@models/stock";
import requireLoggedIn from "@util/AuthUtils";
import { supportRoles } from "@util/Roles";
import { getRandomProxyString, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";
import checkStockValidity, { buildNotesMessage } from "@util/stock/checker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "GET")) {
    const token = await requireLoggedIn(req, res, supportRoles, true);
    if (!token) {
      return;
    }
    const { id } = req.query;
    if (!id) {
      res.status(400).json({ message: "Missing ID" });
      return;
    }
    const UsedStockModel = await getUsedStockModel();
    let stock = await UsedStockModel.findById(id as string);
    if (!stock) {
      const StockModel = await getStockModel();
      stock = await StockModel.findById(id as string);
      if (!stock) {
        res.status(404).json({ message: "Stock not found" });
        return;
      }
    }
    const ProductModel = await getProductModel();
    const product = await ProductModel.findById(stock.productId);

    const { data } = stock;
    const cfg = product.stockCheckerConfig;
    delete cfg.enabled;
    delete cfg.enableAutoReplace;
    const { proxies } = cfg;
    delete cfg.proxies;
    const response = await checkStockValidity({
      ...cfg,
      proxy: await getRandomProxyString(proxies, "stockCheckerProxies"),
      maxRetries: await getSetting("maxErrorRetries", 3),
      data,
    });
    const note = buildNotesMessage(response);
    if (note && stock.orderId) {
      const order = await resolveOrder(stock.orderId.toString());
      if (order) {
        order.notes += note;
        await order.save();
      }
    }
    res.status(200).json({
      response,
      note,
    });
  }
}
