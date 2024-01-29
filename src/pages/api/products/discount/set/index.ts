import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
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
      const SettingsModel = await getSettingsModel();
      const { products, discount, code, paymentMethod } = req.body;
      if (products.length === 0 || !paymentMethod||!discount || !code) {
        res.status(400).json({ success: false, message: "All fields are required" });
        return;
      }

      // Check for duplicate products
      const uniqueProducts = new Set(products);
      if (uniqueProducts.size !== products.length) {
        res.status(400).json({
          success: false,
          message: "There are duplicate products!",
        });
        return;
      }

      // Make a db call to get the featured products to make sure they exist
      const ProductModel = await getProductModel();
      const discountProducts = await ProductModel.find({
        _id: { $in: products },
      });

      if (discountProducts.length !== products.length) {
        res.status(400).json({
          success: false,
          message: "Some products does not exist!",
        });
        return;
      }

      // Loop through featured products to check if they contain no options
      for (const product of discountProducts) {
        if (!product.options || product.options.length <= 0) {
          res.status(400).json({
            success: false,
            message:
              "There must be at least one option for each product",
          });
          return;
        }
      }

      let discountData = {
        code,
        discount,
        products,
        paymentMethod,
      };

      const existingDocument = await SettingsModel.findOne({ key: "discountProducts" });

      if (existingDocument) {
        const updatedValue = [...existingDocument.value];
        const index = updatedValue.findIndex((item) => item.paymentMethod === paymentMethod);

        if (index !== -1) {
          // If payment method already exists, update only new products
          const existingProductIds = updatedValue[index].products;
          const newProducts = products.filter((productId:any) => !existingProductIds.includes(productId));

          if (newProducts.length > 0) {
            updatedValue[index].products = [...existingProductIds, ...newProducts];
          }

          if(code&&discount){
            updatedValue[index].code = code;
            updatedValue[index].discount = discount;
          }
        } else {
          updatedValue.push(discountData);
        }

        await SettingsModel.updateOne({ key: "discountProducts" }, { value: updatedValue });
      } else {
        await SettingsModel.create({ key: "discountProducts", value: [discountData] });
      }

      res.status(200).json({
        success: true,
        message: "Discount products updated",
      });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}


export default handler;
