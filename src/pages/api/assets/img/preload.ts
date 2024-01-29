import { NextApiRequest, NextApiResponse } from "next";

import getProductModel from "@models/product";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ProductModel = await getProductModel();
  // get a array of strings from the image field of all products
  const images = await ProductModel.find({}).select("image");
  // return the array of strings
  res.status(200).json({
    success: true,
    images: images.map((p: { image: string }) => p.image),
  });
}
