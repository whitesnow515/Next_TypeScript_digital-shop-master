import { FullProductInterfaceWithOption } from "@app-types/models/product";
import AppWrapper from "@components/AppWrapper";
import Arrivals from "@components/home/Arrivals";
import TopSection from "@components/home/TopSection";
import getOrderModel from "@models/order";
import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";

const Home = ({ featuredProducts, stats, newArrivals }: any) => {
  return (
    <div className="flex flex-col bg-[#141716] w-full">
      <AppWrapper>
        <TopSection />
        <div className="bg-[#141716] flex flex-col w-full">
          <Arrivals
            data={newArrivals.slice(0, 9) || []}
            featuredProducts={featuredProducts}
            title="NEW ARRIVALS"
            style={"border-b border-[#404242] !pt-[91px]"}
          />
          <Arrivals
            featuredProducts={featuredProducts}
            data={
              Array.isArray(stats)
                ? stats.sort((a: any, b: any) => b.timesBought - a.timesBought)
                : []
            }
            title="top selling"
          />
          {/*<TrendingCategory />*/}
        </div>
      </AppWrapper>
    </div>
  );
};

export const getServerSideProps = async () => {
  // this checks if one of the roles is found, not that every role must be present

  let Order = await getOrderModel();
  let productmodel = await getProductModel();

  let products = await productmodel.find({});

  let array = [];

  for (const product of products) {
    const result = await Order.aggregate([
      {
        $unwind: "$subOrders",
      },
      {
        $match: {
          "subOrders.product": product._id,
          status: "completed" && "complete",
        },
      },
      {
        $group: {
          _id: product._id,
          totalSold: { $sum: "$subOrders.stockLines" },
          product: { $first: "$subOrders" },
        },
      },
    ]);

    if (result.length > 0) {
      const { totalSold, product } = result[0];

      array.push({ ...product, timesBought: totalSold });
    }
  }

  // Sort the array based on timesBought in descending order
  const sortedArray = array.sort((a, b) => b.timesBought - a.timesBought);

  // Limit to the top 10 products
  const top10Products = sortedArray.slice(0, 10);

  // Extract product IDs from the top sold products
  const topSoldProductIds = top10Products.map((product) => product?.product);

  // Get all products with matching IDs
  const allProducts = await productmodel.find({
    _id: { $in: topSoldProductIds },
  });

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
    const rawData = await productmodel
      .find({
        _id: { $in: featuredProducts },
      })
      .populate("category");

    let data = allProducts;

    return Promise.all(rawData);
  }

  const data = JSON.parse(JSON.stringify(await getProductData()));

  return {
    props: {
      featuredProducts: data,
      newArrivals:
        JSON.parse(JSON.stringify(products.length > 0 && products)) || [],
      stats:
        JSON.parse(JSON.stringify(allProducts.length > 0 && allProducts)) || [],
    },
  };
};

export default Home;
