import { NextApiRequest, NextApiResponse } from 'next';
import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, 'POST')) {
    const token = await requireLoggedIn(req, res, ['admin'], true);
    if (!token) {
      return;
    }

    try {
      const SettingsModel = await getSettingsModel();
      const { productId, paymentMethod } = req.body;

      if (!productId || !paymentMethod) {
        res.status(400).json({ success: false, message: 'Product ID and payment method are required' });
        return;
      }

      const existingDocument = await SettingsModel.findOne({ key: 'discountProducts' });

      if (existingDocument) {
        const updatedValue = [...existingDocument.value];

        for (const item of updatedValue) {
          if (item.paymentMethod === paymentMethod) {
            // Remove the selected product from the products array
            item.products = item.products.filter((pId: string) => pId !== productId);
          }
        }

        // Remove entries with empty products array
        const filteredValue = updatedValue.filter((item) => item.products.length > 0);

        await SettingsModel.updateOne({ key: 'discountProducts' }, { value: filteredValue });

        res.status(200).json({ success: true, message: 'Product removed from discount products' });
      } else {
        res.status(404).json({ success: false, message: 'Discount products not found' });
      }
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: 'Something went wrong' });
    }
  }
}

export default handler;
