import React, { useState } from "react";

import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import Swal from "sweetalert2";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import {
  cleanSensitiveOrderData,
  SubOrderInterface,
} from "@app-types/models/order";
import Alert from "@components/Alert";
import AppWrapper from "@components/AppWrapper";
import Card from "@components/Card";
import Stock from "@components/dashboard/Stock";
import FormButton from "@components/FormButton";
import OrderInfo from "@components/OrderInfo";
import { Meta } from "@components/templates/Meta";
import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import getUserModel from "@models/user";
import { debug, error as errorLog } from "@util/log";
import { hasRoles, supportRoles } from "@util/Roles";
import { getSetting } from "@util/SettingsHelper";
import { Eye, Package } from "phosphor-react";
import Link from "next/link";
import getProductModel from "@models/product";
import Product from "@components/Product";

const RenderStatus = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <span className="text-xs font-medium me-2 px-2.5 py-1 rounded-full bg-[#2d4c2d] text-[#2BF627]">
        Complete
      </span>
    );
  }
  if (status === "awaiting-verification") {
    return (
      <span className="text-xs font-medium me-2 px-2.5 py-1 rounded-full whitespace-nowrap bg-yellow-900 text-yellow-300">
        Awaiting Verification
      </span>
    );
  }
  return (
    <span className="text-xs font-medium me-2 px-2.5 py-1 rounded-full bg-yellow-900  text-yellow-300">
      Pending
    </span>
  );
};
const ViewOrderPage = ({
  id,
  order,
  orderData,
  errAlert,
  infAlert,
  payUrl,
  message,
  showReceiptButton,
  cart: subOrders,
  ordersWithProductData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [inf, setInfo] = useState<string>(infAlert as string);
  const [err, setError] = useState<string>(errAlert as string);

  return (
    <AppWrapper>
      <Meta title={`Orders`} description={"Your orders"} />
      <div className="w-full flex justify-center">
        <div className="antialiased text-gray-600 min-h-[calc(100vh-171px)] w-[60%]">
          {message && <Alert type={"info"}>{message}</Alert>}
          {inf && (
            <Alert
              type={"info"}
              dismissible
              onDismiss={() => {
                setInfo("");
              }}
            >
              {inf}
            </Alert>
          )}
          {err && (
            <Alert
              type={"error"}
              dismissible
              onDismiss={() => {
                setError("");
              }}
            >
              {err}
            </Alert>
          )}
          {order && orderData ? (
            <>
              <div>
                <h1 className="mt-5 mb-3 text-white font-bold text-2xl">
                  Order
                </h1>
                <Card width="20">
                  <OrderInfo order={order} orderData={orderData} />
                </Card>
                <h1 className="mt-5 mb-3 text-white font-bold text-2xl">
                  Cart
                </h1>
                <div>
                  <div className="flex flex-wrap gap-2 lg:gap-7 items-center">
                    {ordersWithProductData.map((sb: any) => (
                      <div className="shrink-0 xl:w-[31%] lg:w-[30%] md:w-[40%] w-full sm:w-[48%] gap-6 ">
                        <Product
                          price={sb.productPrice}
                          // legacyImage=""
                          defaultImage=""
                          featured={false}
                          oos=""
                          name={sb.productName}
                          orderProduct={true}
                          orderId={id}
                          productId={sb.product}
                          image={sb.image}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* {(!order.paid || order.metadata?.awaitingAccept) && (
                <div className="w-full flex flex-col mt-3 gap-2 items-end justify-end mb-[30px]">
                  <span className="text-sm text-yellow-300">
                    This order is not paid yet!
                  </span>
                  <>
                    <div className="flex w-auto gap-2 justify-end items-center">
                      {!order?.metadata?.awaitingAccept && (
                        <>
                          <FormButton
                            type="button"
                            className={
                              "bg-black hover:text-black hover:bg-white text-white shrink-0"
                            }
                            onClick={(e) => {
                              e.preventDefault();

                              return axios
                                .post("/api/checkout/atc", {
                                  orderId: order._id,
                                  use_balance: false,
                                  use_sellix: true,
                                  pending_order: true,
                                })
                                .then((res) => {
                                  window.location.href = res.data.paymentUrl;
                                  console.log(res);
                                })
                                .catch((eX) => {
                                  if (eX?.response?.data?.message) {
                                    setError(eX.response.data.message);
                                  } else {
                                    setError(
                                      "An error occurred! Please try again later!"
                                    );
                                  }
                                });
                            }}
                          >
                            Pay
                          </FormButton>
                          {order.paymentMethod === "Coinbase" && (
                            <FormButton
                              type={"button"}
                              className={"shrink-0"}
                              onClickLoading={() => {
                                return axios
                                  .post("/api/checkout/coinbase/restart", {
                                    orderId: order._id,
                                  })
                                  .then((res) => {
                                    window.location.href = res.data.url;
                                  })
                                  .catch((eX) => {
                                    if (eX?.response?.data?.message) {
                                      setError(eX.response.data.message);
                                    } else {
                                      setError(
                                        "An error occurred! Please try again later!"
                                      );
                                    }
                                  });
                              }}
                            >
                              Request New Coinbase Payment
                            </FormButton>
                          )}
                        </>
                      )}
                      {order.paymentMethod === "CashApp" && (
                        <>
                          {showReceiptButton && (
                            <FormButton
                              type="button"
                              className={"mt-4 shrink-0"}
                              onClick={() => {
                                // Ask user for link to cashapp receipt
                                Swal.fire({
                                  title: "Receipt URL",
                                  html: `<span>Please enter the URL to your CashApp receipt.</span><a class="text-white" href="
https://www.youtube.com/watch?v=L80p5W_3HJQ">(video)</a>`,
                                  icon: "info",
                                  showCancelButton: true,
                                  confirmButtonText: "Submit",
                                  cancelButtonText: "Cancel",
                                  input: "url",
                                  inputLabel: "URL",
                                  inputPlaceholder:
                                    "https://cash.app/payments/...",
                                  inputValue: "",
                                  preConfirm(inputValue: any) {
                                    // check if url is valid and is cash.app/payments
                                    if (
                                      !inputValue
                                        .toLowerCase()
                                        .trim()
                                        .startsWith(
                                          "https://cash.app/payments/"
                                        )
                                    ) {
                                      Swal.showValidationMessage(
                                        `Please enter a valid CashApp receipt URL!`
                                      );
                                    }
                                  },
                                }).then((value) => {
                                  if (value.isConfirmed) {
                                    const valueData =
                                      value.value as unknown as string;
                                    const url = new URL(valueData);
                                    const cashappId =
                                      url.pathname.split("/")[2];
                                    debug({
                                      cashappId,
                                      valueData,
                                    });
                                    Swal.fire({
                                      title: "Please wait...",
                                      html: "Retrieving Receipt...",
                                      allowOutsideClick: false,
                                      didOpen: () => {
                                        Swal.showLoading();
                                      },
                                    });
                                    axios
                                      .post(
                                        `/api/checkout/check/${order._id}/receipt?cashAppId=${cashappId}`
                                      )
                                      .then((res) => {
                                        if (res.data.finished) {
                                          window.location.href =
                                            res.data.redirectUrl ||
                                            "/pay/success/";
                                        } else {
                                          const msg =
                                            res.data.message ||
                                            "Payment not found, please try again later!";
                                          Swal.fire({
                                            title: "Error",
                                            text: msg,
                                            icon: "error",
                                          });
                                        }
                                      })
                                      .catch((eX) => {
                                        Swal.fire({
                                          title: "Error",
                                          text:
                                            eX?.response?.data?.message ||
                                            "An error occurred! Please try again later!",
                                          icon: "error",
                                        });
                                      });
                                  }
                                });
                              }}
                            >
                              Check Receipt
                            </FormButton>
                          )}
                        </>
                      )}
                      {!order?.metadata?.awaitingAccept &&
                        order.status === "pending" && (
                          <>
                            <FormButton
                              type="button"
                              color={"red"}
                              className={
                                "shrink-0 bg-black text-white hover:text-black hover:bg-white"
                              }
                              onClick={() => {
                                axios
                                  .delete(`/api/orders/cancel?id=${order._id}`)
                                  .then((res) => {
                                    window.location.href = `/orders/`;
                                  })
                                  .catch((eX) => {
                                    errorLog(eX);
                                    if (eX?.response?.data?.message) {
                                      setError(eX.response.data.message);
                                    } else {
                                      setError(
                                        "An error occurred! Please try again later!"
                                      );
                                    }
                                  });
                              }}
                            >
                              Cancel Order
                            </FormButton>
                          </>
                        )}
                    </div>
                  </>
                </div>
              )} */}
              {/*<div className="flex flex-wrap justify-center">*/}
              {/*  {orderData?.stocks?.map((stock: any, i: number) => {*/}
              {/*    return (*/}
              {/*      <Stock*/}
              {/*        key={i}*/}
              {/*        number={i + 1}*/}
              {/*        stockId={stock?.id?.toString() || ""}*/}
              {/*        fileName={stock?.fileName || ""}*/}
              {/*        color={i % 2 === 0 ? "purple" : "black"}*/}
              {/*        replacement={stock.replacement}*/}
              {/*      />*/}
              {/*    );*/}
              {/*  })}*/}
              {/*</div>*/}
            </>
          ) : (
            <span className="text-2xl mt-2.5 font-bold text-white text-center">
              Order not found!
            </span>
          )}
        </div>
      </div>
    </AppWrapper>
  );
};

export default ViewOrderPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const allowGuest = await getSetting("guestOrders", false);
  const session: any = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  if (!session && !allowGuest) {
    return {
      props: {
        error: true,
        message:
          "Invalid session! Please log out/in again, or clear your cookies!",
      },
    };
  }
  try {
    const OrderModel = await getOrderModel();
    const ProductModel = await getProductModel();
    const { id } = context.query;
    let order = await OrderModel.findById(id as string);
    const { error, info } = context.query;
    if (!order) {
      const PendingOrderModel = await getPendingOrderModel();
      order = await PendingOrderModel.findById(id as string);
    }
    let awaiting = false;
    if (!order) {
      awaiting = true;
      const AwaitingModel = await getAwaitingVerificationModel();
      order = await AwaitingModel.findById(id as string);
      order.subOrders[0].stocks = []; // hide stocks from user
    }
    if (!order) {
      return {
        props: {
          success: false,
          message: "Order not found!",
          errAlert: error || "",
          infAlert: info || "",
        },
      };
    }
    const UserModel = await getUserModel();
    const user = session
      ? await UserModel.findOne({
          email: session.user.email,
          username: session.user.name,
        })
      : null;
    const isStaff = user && hasRoles(user?.roles, supportRoles, false);
    if (order.user && !isStaff) {
      if (!user || user._id.toString() !== order.user.toString()) {
        return {
          props: {
            success: false,
            message: "User not found!",
            errAlert: error || "",
            infAlert: info || "",
          },
        };
      }
    }
    const coinbaseUrl =
      order.paymentMethod === "Coinbase"
        ? order.metadata?.coinbase?.hosted_url
        : order.shortId
        ? `https://commerce.coinbase.com/charges/${order.shortId}`
        : ``;
    // delete order.notes;
    // delete order.metadata;
    order = cleanSensitiveOrderData(order);
    const subOrder = order.subOrders[0] as SubOrderInterface;
    if (!subOrder) {
      return {
        props: {
          success: false,
          message: "Suborder not found!",
          errAlert: error || "",
          infAlert: info || "",
        },
      };
    }
    let showReceiptButton = false;
    if (
      order.paymentMethod === "cashapp" &&
      order.status.toLowerCase() === "pending"
    ) {
      showReceiptButton = await getSetting("cashAppReceiptChecking", true);
    }

    const orderProductIds = order.subOrders.map((order: any) => order.product);

    const ordersWithProductData = await ProductModel.find({
      _id: { $in: orderProductIds },
    })
      .then((products: any) => {
        const ordersWithProductData = order.subOrders.map((order: any) => {
          const productData = products.find(
            (product: any) => product._id.toString() === order.product
          );
          return { ...order, image: productData.image };
        });
        return ordersWithProductData;
      })
      .catch((error: Error) => {
        console.error(error);
      });

    return {
      props: {
        id,
        success: true,
        order,
        orderData: subOrder,
        cart: order.subOrders,
        ordersWithProductData,
        errAlert: error || "",
        infAlert: info || "",
        awaitingVerification: awaiting,
        showReceiptButton,
        payUrl:
          order.paymentMethod === "cashapp"
            ? `/pay/cashapp/${order._id}`
            : coinbaseUrl || "",
      },
    };
  } catch (e) {
    errorLog(e);
    return {
      props: {
        success: false,
        message: "An error occurred! Please try again later.",
      },
    };
  }
}
