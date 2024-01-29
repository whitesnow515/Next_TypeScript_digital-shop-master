import React, { useState } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@api/auth/[...nextauth]";
import Alert from "@components/Alert";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import getUserModel from "@models/user";
import Product from "@components/Product";
import getProductModel from "@models/product";

import { Skeleton } from "@mui/material";
import UserPanelLayout from "@components/templates/UserPanelLayout";
import CustomPagination from "@components/CustomPagination";
import { useRouter } from "next/router";

const Index = ({
  ordersWithProductData,
  orders,
  message,
  success,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [search, setSearch] = useState("");
  const [currentItems, setCurrentItems] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();
  // const rowsPerPage = 3; // Set the maximum number of rows per page
  // const slicedItems = currentItems.slice(0, rowsPerPage);

  return (
    <UserPanelLayout title={`Orders`} description={"Your orders"}>
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-white text-3xl font-semibold text-center">
            My Orders
          </h1>
          {message && (
            <Alert type={"error"} className={"mx-8"}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert type={"error"} className={"mx-8"}>
              {error}
            </Alert>
          )}
        </div>

        {orders && orders.length > 0 && (
          <div className="lg:w-[55%] md:w-[60%] w-full flex gap-3 items-end justify-end">
            <div className="bg-[#393F3C] mt-4 md:mt-0 lg:w-[50%] w-[100%] text-white border-transparent border-2 focus-within:border-[#FF1F40] relative rounded-full flex items-center gap-3 py-2 px-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.1111 5C7.73604 5 5 7.73604 5 11.1111C5 14.4862 7.73604 17.2222 11.1111 17.2222C12.7989 17.2222 14.3253 16.5393 15.4323 15.4323C16.5393 14.3253 17.2222 12.7989 17.2222 11.1111C17.2222 7.73604 14.4862 5 11.1111 5ZM3 11.1111C3 6.63147 6.63147 3 11.1111 3C15.5908 3 19.2222 6.63147 19.2222 11.1111C19.2222 12.9901 18.5824 14.721 17.5101 16.0959L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L16.0959 17.5101C14.721 18.5824 12.9901 19.2222 11.1111 19.2222C6.63147 19.2222 3 15.5908 3 11.1111Z"
                  fill="currentColor"
                ></path>
              </svg>
              <input
                placeholder="Search for orders..."
                className="bg-transparent text-base font-normal text-white focus:border-[#FF1F40]  placeholder:text-[#75817B] border-none outline-none w-full"
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className={"mt-7"}>
        <div className="">
          {!router.isReady ? (
            <>
              <div className="flex justify-between flex-wrap gap-y-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((data) => (
                  <div className="">
                    <div>
                      <Skeleton
                        variant="rectangular"
                        width={330}
                        height={200}
                      />
                    </div>
                    <div className="w-[60%] mt-3">
                      <Skeleton variant="text" />
                      <Skeleton width={30} variant="text" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="gap-4 grid grid-cols-2 xl:grid-cols-4 lg:grid-cols-3">
              {currentItems?.length === 0 ? (
                <p className="text-white">No data matched</p>
              ) : (
                <>
                  {currentItems?.map((sb: any) => (
                    <>
                      <div className="shrink-0 transition-transform delay-300 gap-6 ">
                        <Product
                          price={sb.productPrice}
                          defaultImage=""
                          featured={false}
                          oos=""
                          orderId={sb.orderId}
                          name={`${sb.productName} - ${sb.productOption}`}
                          orderProduct={true}
                          productId={sb.product?.toString()}
                          image={sb.productImage}
                        />
                      </div>
                    </>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <CustomPagination
          data={ordersWithProductData}
          setCurrenItems={setCurrentItems}
          search={search}
        />
      </div>
    </UserPanelLayout>
  );
};

export default Index;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session: any = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  if (!session) {
    return {
      props: {
        error: true,
        message: "Please log in.",
      },
    };
  }
  try {
    const userModel = await getUserModel();
    const ProductModel = await getProductModel();
    const user = await userModel.findOne({
      email: session.user.email,
      username: session.user.name,
    });
    if (!user) {
      const { error, info } = context.query;
      return {
        props: {
          success: false,
          message: "User not found!",
          errAlert: error || "",
          infAlert: info || "",
        },
      };
    }

    const OrderModel = await getOrderModel();
    const orders: any = await OrderModel.find({
      user: user._id,
    });
    if (!orders) {
      const { error, info } = context.query;
      return {
        props: {
          success: false,
          message: "Orders not found!",
          errAlert: error || "",
          infAlert: info || "",
        },
      };
    }

    const PendingOrderModel = await getPendingOrderModel();
    const pendingOrders: any =
      (await PendingOrderModel.find({
        user: user._id,
      })) || [];
    const bothOrders = [...pendingOrders, ...orders];
    const orderProductIds = bothOrders.flatMap((data) =>
      data.subOrders.map((order: any) => order.product)
    );

    const products = await ProductModel.find({
      _id: { $in: orderProductIds },
    });

    const ordersWithProductData = bothOrders.map((order) => {
      const subOrdersWithProductData = order.subOrders.map((subOrder: any) => {
        const productData = products.find(
          (product: any) =>
            product._id.toString() === subOrder.product.toString()
        );
        const productImage = productData.image;
        return { ...subOrder.toObject(), productImage };
      });
      return { ...order.toObject(), subOrders: subOrdersWithProductData };
    });
    return {
      props: {
        orders: JSON.parse(JSON.stringify(bothOrders || [])),
        ordersWithProductData: JSON.parse(
          JSON.stringify(ordersWithProductData || [])
        ),
        success: true,
      },
    };
  } catch (e) {
    return {
      props: {
        success: false,
        message: "An error occurred! Please try again later.",
      },
    };
  }
}
