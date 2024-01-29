import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import getOrderModel from "@models/order";
import getStockModel, { getUsedStockModel } from "@models/stock";
import { getCurrentUser } from "@util/AuthUtils";
import { hasRoles, supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const allowGuest = await getSetting("guestOrders", false);
    const user = await getCurrentUser(req, res);
    const isStaff = user && hasRoles(user?.roles, supportRoles, false);
    const UsedStockModel = await getUsedStockModel();
    const { id } = req.query;
    const OrderModel = await getOrderModel();
    
    if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid stock id",
      });
      return;
    }
    let stock = await UsedStockModel.findById(id as string);
    const order = await OrderModel.findOne({
      _id: stock?.orderId,
    });

    if (!stock) {
      // used stock only
      if (isStaff) {
        const StockModel = await getStockModel();
        stock = await StockModel.findById(id as string);
        if (!stock) {
          res.status(404).json({
            success: false,
            noStock: true,
            message: "Stock not found",
          });
          return;
        }
      } else {
        res.status(404).json({
          success: false,
          noStock: true,
          message: "Stock not found",
        });
        return;
      }
    }
    
    if (stock.user) {
      if (!user && !allowGuest) {
        res.status(401).json({ success: false, message: "Not logged in" });
        return;
      }
      if (!user || stock.user.toString() !== user._id.toString())
        if (!isStaff) {
          // stock is owned by user, but request is not from user
          // user is not admin
          res.status(403).json({
            success: false,
            message: "You do not have access to this stock.",
          });
          return;
        }
      }
      if (!isStaff) {
        
        
        if (!order) {
          res.status(404).json({
            success: false,
            message: "Order not found",
          });
          return;
        }

        
        const orderData = order.subOrders[0];
      if (orderData) {
        const { stocks } = orderData;
        if (stocks) {
          const stockData = stocks.find(
            (s: any) => s.id.toString() === stock._id.toString()
          );
          if (!stockData.firstAccessed) {
            stockData.firstAccessed = new Date();
          }
          stockData.lastAccessed = new Date();
        }
      }
      await order.save(); // update first and last accessed
    }
    const { data } = stock;
    const { raw } = req.query;
    if(!order){
      res.status(404).json({
        success: false,
        noStock: true,
        message: "Order not found",
      });
    }
    let orderCheck= order.subOrders.find((data:any)=>data.productOptionId.toString()===stock.optionId.toString())
    // console.log(req,"orderCheckorderCheck");
    // || user.roles.includes("admin")
    if(orderCheck.status!=="awaiting-verification"){
      if (raw === "true") {
        // return raw data, not json
        res.setHeader("Content-Type", "text/plain");
        res.send(data.join("\n"));
      } else {
        res.status(200).json({
          success: true,
          message: "Stock found",
          data,
        });
      }
    }else{
      res.setHeader("Content-Type", "text/plain");
      res.send(["Order is in awaiting verification"].join("\n"));
    }
  }
}

export default handler;
