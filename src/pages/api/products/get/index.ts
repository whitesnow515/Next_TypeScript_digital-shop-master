import { ObjectId } from "bson";
import { NextApiRequest, NextApiResponse } from "next";

import {
  cleanSensitiveProductData,
  getDefaultOption,
} from "@app-types/models/product";
import getProductModel from "@models/product";
import { getCurrentUser } from "@util/AuthUtils";
import getFeatured from "@util/common/featured";
import { log } from "@util/log";
import { getFullProductWithOptionAndStock } from "@util/products";
import { getRedisClient } from "@util/RedisHolder";
import escapeRegExp from "@util/regex";
import { hasRoles, supportRoles } from "@util/Roles";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const redisClient = await getRedisClient();
      const limit: number = parseInt(req.query.limit as string, 10) || 16;
      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit cannot be greater than 100",
        });
        return;
      }
      const category=req.query.category
      const page: number = parseInt(req.query.page as string, 10) || 0;
      const search: string = escapeRegExp(req.query.search as string) ?? null;
      const user = await getCurrentUser(req, res);
      const isStaff = user && hasRoles(user?.roles, supportRoles, false);
      const hideFeatured = req.query.hideFeatured === "true";
      const showHidden = isStaff && req.query.alldata === "true";
      const sortByLastStocked = req.query.sortByLastStocked === "true";
      const sortByNumStockLines = req.query.sortByNumStockLines === "true";
      const cached = await redisClient.get(
        `products-${showHidden}-${search}-${page}-${limit}-${sortByLastStocked}-${sortByNumStockLines}-${showHidden}-${hideFeatured}`
      );
      if (cached && process.env.NODE_ENV !== "development") {
        res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
        return;
      }
      const filterIds: ObjectId[] = [];
      if (hideFeatured) {
        const featured = await getFeatured();
        featured.forEach((product) => {
          filterIds.push(new ObjectId(product.id));
        });
      }
      const ProductModel = await getProductModel();
      const data: any[] = await ProductModel.aggregate([
        // ...(filterIds.length > 0
        //   ? [
        //       {
        //         $match: {
        //           _id: {
        //             $nin: filterIds,
        //           },
        //         },
        //       },
        //     ]
        //   : []),
        ...(category!=="all"
          ? [
              {
                $match: {
                category:new ObjectId(category as string),
                }
              }
            ]
          : []),
        ...(!showHidden
          ? [
              {
                $match: {
                  hidden: false,
                },
              },
            ]
          : []),
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    {
                      name: { $regex: search, $options: "i" },
                    },
                    {
                      description: { $regex: search, $options: "i" },
                    },
                    {
                      shortDescription: { $regex: search, $options: "i" },
                    },
                    ...(ObjectId.isValid(search)
                      ? [
                          {
                            _id: new ObjectId(search),
                          },
                        ]
                      : []),
                    {
                      "options.name": { $regex: search, $options: "i" },
                    },
                    {
                      "options.productName": { $regex: search, $options: "i" },
                    },
                  ],
                },
              },
            ]
          : []),
        ...(sortByLastStocked
          ? [
              {
                $sort: {
                  lastStocked: -1,
                },
              },
            ]
          : []),
        ...(sortByNumStockLines
          ? [
              {
                $sort: {
                  totalStockLines: -1,
                },
              },
            ]
          : []),
        {
          $facet: {
            search: [
              {
                $skip: page ? (page as number) * (limit as number) : 0,
              },
              {
                $limit: limit ? (limit as number) : 15,
              },
            ],
            size: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      data[0].search = await ProductModel.populate(data[0].search, {path: "category"})

      let searchResults;
      let count = 0;
      if (!data) {
        searchResults = [];
        count = 0;
      } else {
        searchResults = data[0].search;
        if (data[0] && data[0].size) {
          count = data[0].size[0]?.count;
        }
      }

      // Clean sensitive product data and filter hidden products
      const cleanData: any[] = showHidden
        ? searchResults
        : searchResults
            .filter((product: any) => !product.hidden)
            .map((product: any) => {
              return {...cleanSensitiveProductData(product), category: product.category}
            });
      const { allStock } = req.query;
      // Retrieve full products with options and stock
      const promises = cleanData.map(async (product: any) =>
        getFullProductWithOptionAndStock(
          product,
          allStock === "true" ? null : getDefaultOption(product),
          true
        )
      );
      const fullProducts = await Promise.all(promises);

      await redisClient.set(
        "products",
        JSON.stringify(fullProducts),
        "EX",
        120
      ); // Cache data for 2 minutes

      const maxPage = Math.ceil(count / limit);


      res.status(200).json({
        success: true,
        data: fullProducts,
        size: count,
        maxPage,
      });

      /*
      const data: ProductInterface[] = JSON.parse(
        JSON.stringify(await ProductModel.find())
      )
        .filter((product: any) => !product.hidden)
        .map((product: any) => {
          return cleanSensitiveProductData(product);
        });

      const promises = data.map(async (product: any) => {
        return getFullProductWithOptionAndStock(
          product,
          getDefaultOption(product),
          true
        );
      });
      const fullProducts = await Promise.all(promises);
      await redisClient.set(
        "products",
        JSON.stringify(fullProducts),
        "EX",
        120
      ); // 2 minutes
      res.status(200).json({
        success: true,
        data: fullProducts,
      });
       */
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
