import React from "react";

import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";

import {
  cleanSensitiveProductData,
  FullProductInterfaceWithOption,
  getFullProductWithOption,
  ProductInterface,
} from "@app-types/models/product";
import AppWrapper from "@components/AppWrapper";
import ImagePreloader from "@components/ImagePreloader";
import { Hero } from "@components/templates/Hero";
import { Meta } from "@components/templates/Meta";
import Products from "@components/templates/Products";
import Reviews from "@components/templates/Reviews";
import getProductModel, { getProductCategoryModel } from "@models/product";
import getSettingsModel from "@models/settings";
import { AppConfig } from "@util/AppConfig";
import getStockManager from "@util/stock/StockManagerHolder";
import ProductsV2 from "@components/ProductsV2";
import Home from ".";

const Index = ({
  featuredProductsData,
  categories,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <AppWrapper>
      <div className="antialiased text-gray-600">
        <Meta
          title={"dummy"}
          titleOverride={AppConfig.title} // override entire title
          description={AppConfig.description}
        />
        <ImagePreloader />
        <div className={"w-full"}>
          {/* <Home /> */}
          <ProductsV2
            featuredProducts={featuredProductsData}
            categories={categories}
          />
        </div>
        {/* <Reviews /> */}
      </div>
    </AppWrapper>
  );
};

export default Index;

const getCategories = async (productModel: any) => {
  const CategoryModel = await getProductCategoryModel();
  const categories = await CategoryModel.find().lean().exec();
  if (CategoryModel) {
    for (var category of categories) {
      category.items = await productModel.count({
        category: category._id,
        hidden: false,
      });
    }
    return JSON.parse(JSON.stringify(categories));
  }
};
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const ProductModel = await getProductModel();
  const allProducts = await ProductModel.find({});
  async function getProductData(): Promise<FullProductInterfaceWithOption[]> {
    const productsData: FullProductInterfaceWithOption[] = [];
    const SettingsModel = await getSettingsModel();
    const settingsData = await SettingsModel.findOne({
      key: "featuredProducts",
    });
    if (!settingsData) {
      return [];
    }
    const { value } = settingsData;
    const featuredProducts = value as string[];
    if (!featuredProducts || featuredProducts.length === 0) {
      return [];
    }
    const rawData = await ProductModel.find({
      _id: { $in: featuredProducts },
    }).populate("category");

    let data = allProducts;

    return Promise.all(rawData);
  }

  const data = JSON.parse(JSON.stringify(await getProductData()));

  return {
    props: {
      featuredProductsData: data,
      categories: await getCategories(ProductModel),
    },
  };
}
