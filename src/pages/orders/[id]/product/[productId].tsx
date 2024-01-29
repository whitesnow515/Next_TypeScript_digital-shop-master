import React, { memo, useEffect, useState } from "react";
import { ObjectId } from "bson";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import {
  cleanSensitiveOrderData,
  getWarrantyExpiryDate,
  SubOrderInterface,
} from "@app-types/models/order";
import Alert from "@components/Alert";
import AppWrapper from "@components/AppWrapper";
import { Meta } from "@components/templates/Meta";
import getOrderModel, {
  getAwaitingVerificationModel,
  getPendingOrderModel,
} from "@models/order";
import getUserModel from "@models/user";
import { error, error as errorLog } from "@util/log";
import { hasRoles, supportRoles } from "@util/Roles";
import { getSetting } from "@util/SettingsHelper";
import { Question } from "phosphor-react";
import Link from "next/link";
import getProductModel from "@models/product";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { GridExpandMoreIcon } from "@mui/x-data-grid-pro";
import { useSnackbar } from "notistack";
import { copyToClipboard } from "@pages/pay/cashapp/[id]";
import { completeStatus, pendingStatus } from "@root/currency";
import OrderStatus from "@components/OrderStatus";

const RenderStatus = ({ status }: { status: string }) => {
  if (
    completeStatus.includes(status) ||
    status.toLowerCase() === "completed" ||
    status.toLowerCase() === "complete"
  ) {
    return (
      <div className={"flex gap-0 me-2 py-2"}>
        <div className="flex items-center bg-[#59D990] border border-[#59D990] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs font-medium rounded-full text-white">
          {status}
        </span>
      </div>
    );
  }
  if (status === "awaiting-verification") {
    return (
      <div className={"flex gap-0 me-2 py-2"}>
        <div className="flex items-center bg-[#FFC700] border border-[#FFC700] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs font-medium rounded-full text-white">
          Awaiting Verification
        </span>
      </div>
    );
  }
  if (pendingStatus.includes(status)) {
    return (
      <div className={"flex gap-0 me-2 py-2"}>
        <div className="flex items-center bg-[#FFC700] border border-[#FFC700] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs font-medium rounded-full text-white">
          {status}
        </span>
      </div>
    );
  }
  return (
    <div className={"flex gap-0 me-2 py-2"}>
      <div className="flex items-center bg-[#FF1F40] border border-[#FF1F40] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
      <span className="text-xs font-medium rounded-full text-white">
        {status}
      </span>
    </div>
  );
};
const ViewOrderProductPage = ({
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
  const [defaultImage, setDefaultImage] = useState("");
  const snackbar = useSnackbar();
  const [errors, setErrors] = useState(false);
  const [isMount, setIsMount] = useState(false);
  const [checkStock, setCheckStock] = useState(false);
  const [data, setData] = useState("Loading...");
  const [id, setId] = useState<string>();
  const [date, setDate] = useState<string>("Loading..."); // thanks, nextjs ssr!
  const [showImg, setShowImg] = useState<boolean>(!!order.image);
  useEffect(() => {
    setDate(new Date(order.timestamp).toLocaleString());
  }, [order.timestamp]);
  let supportLink =
    typeof window !== "undefined"
      ? window.localStorage.getItem("supportLink")
      : false;

  function getImageSrc(image: string) {
    if (image) {
      if (image.indexOf("http") === 0) {
        return image;
      }
      // const domain = window.location.origin;
      return `/api/assets/img/${image}/`;
    }
    if (defaultImage) return defaultImage;
    return null;
  }

  useEffect(() => {
    setIsMount(true);
    getStock();
  }, [id, isMount]);

  const getStock = () => {
    if (isMount && id) {
      axios
        .get(`/api/stock/${id}/get/raw`)
        .then((res) => {
          setData(res.data.toString());
          setErrors(false);
        })
        .catch((err) => {
          error(err);
          setErrors(true);
          let friendlyMessage = err.response?.data?.message;
          setData(friendlyMessage);
          if (!friendlyMessage && err.response?.status === 401) {
            friendlyMessage = "You are not authorized to view this!";
          } else if (!friendlyMessage) {
            friendlyMessage = "An unknown error occurred!";
          }
          snackbar.enqueueSnackbar(friendlyMessage, {
            variant: "error",
          });
        });
    }
  };

  const formateDate = (date: any) => {
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date && date.toLocaleDateString("en-US", options);
  };
  // Replace this with your actual date
  const WarrantyStatus = memo(function WarrantyStatus() {
    if (
      ordersWithProductData &&
      ordersWithProductData.warrantyEnabled &&
      (ordersWithProductData.status === "completed" ||
        ordersWithProductData.status === "complete")
    ) {
      const expiryDate = getWarrantyExpiryDate(
        order,
        false // Disallow defaulting to timestamp
      );
      if (expiryDate) {
        if (expiryDate < new Date()) {
          return (
            <p className={"text-red-500 text-sm text-sm font-semibold"}>
              Expired on{" "}
              {new Date(expiryDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          );
        }
        return (
          <p className={"text-green-500 text-sm text-sm font-semibold"}>
            Active until{" "}
            {new Date(expiryDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <br />
            {/* hours left */}
            <span className={"text-xs"}>
              {Math.floor(
                (expiryDate.getTime() - new Date().getTime()) / 1000 / 60 / 60
              )}{" "}
              hours left
            </span>
          </p>
        );
      }
    }
    return (
      <p className={"text-red-500 text-xs"}>
        Not Active
        {order.status === "awaiting-verification" &&
          " (activates once verified)"}
      </p>
    );
  });
  return (
    <AppWrapper>
      <Meta title={`Orders`} description={"Your orders"} />
      <div className="w-full flex items-center mt-10 justify-center ">
        <div className="border border-[#303633] antialiased bg-[#1F2421] rounded-md p-5 text-gray-600 w-[90%] md:max-w-[60%]">
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
                <div>
                  <div className="">
                    <div className="flex flex-wrap lg:flex-nowrap gap-6 justify-center lg:justify-start items-start">
                      <div className="flex-0 h-auto bg-[#1F2421] py-10 lg:py-0 lg:h-[250px] rounded-md lg:shrink-0 lg:basis-[300px] product-category-container">
                        <div className="w-[75%]">
                          <div className="b-QRbp6v">
                            <div className="b-orzNLz flex flex-col items-center justify-between b-JJssGU b-RRF6jh b-qu6O9G">
                              <div
                                className="b-EXzmIr b-gDKMPS"
                                data-shelf-item-graphic="true"
                              >
                                <span className="b-MgKtnT"></span>{" "}
                                <img
                                  alt={ordersWithProductData.name}
                                  src={
                                    getImageSrc(
                                      ordersWithProductData.image
                                    ) as string
                                  }
                                  className="h-full bg-[#F0F0F0] w-full mx-auto"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-white w-full flex flex-col gap-5">
                        <div className="flex flex-col gap-1 ml-1">
                          <h1 className="text-xl font-bold">
                            {/* {ordersWithProductData.productName} - */}
                            {ordersWithProductData.productOption}
                          </h1>
                          <p className="text-sm">
                            ${ordersWithProductData.productPrice.toFixed(2)}
                          </p>
                        </div>
                        {!checkStock && (
                          <Accordion
                            disabled={
                              order.status.toLowerCase() !== "completed" &&
                              order.status.toLowerCase() !== "complete"
                            }
                            className="bg-transparent"
                          >
                            <AccordionSummary
                              expandIcon={<GridExpandMoreIcon />}
                              aria-controls="panel1a-content"
                              id="panel1a-header"
                              className="my-0 h-0"
                            >
                              <p>Your order information</p>
                            </AccordionSummary>
                            {[...ordersWithProductData.stocks].map(
                              (sck, idx) => (
                                <AccordionDetails className="border-t flex justify-between items-start border-[#303633]">
                                  <div>
                                    {idx === 0 ? (
                                      <button
                                        className="text-sm font-semibold"
                                        // href={`/stock/${sck.id}`}
                                        onClick={() => {
                                          setId(sck.id);
                                          setCheckStock(true);
                                        }}
                                      >
                                        Order
                                      </button>
                                    ) : (
                                      <button
                                        className="text-sm"
                                        // href={`/stock/${sck.id}`}
                                        onClick={() => {
                                          setId(sck.id);
                                          setCheckStock(true);
                                        }}
                                      >
                                        Replacement {idx}{" "}
                                      </button>
                                    )}
                                    <p className="text-[10px] italic text-[#555555]">
                                      {formateDate(
                                        new Date(
                                          sck?.lastAccessed || new Date()
                                        )
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    className="text-sm text-white hover:text-[#B1B5B6] underline"
                                    // href={`/stock/${sck.id}`}
                                    onClick={() => {
                                      setId(sck.id);
                                      setCheckStock(true);
                                    }}
                                  >
                                    View details
                                  </button>
                                </AccordionDetails>
                              )
                            )}
                          </Accordion>
                        )}
                        {checkStock && (
                          <div className="relative">
                            <div className="absolutes flex justify-end gap-3">
                              <button
                                className="text-xs text-[10px] text-white underline"
                                onClick={() => {
                                  setCheckStock(false);
                                }}
                              >
                                Back
                              </button>

                              {/* <FormButton
                                fullWidth={false}
                                className={"mr-2"}
                                onClick={() => {
                                  window.location.href = `/stock/${id}/raw`;
                                }}
                              >
                                Raw
                              </FormButton> */}
                            </div>
                            <div className="flex mt-3 bg-[#303633] border-2 border-[#272D29] rounded-md px-3 py-2 flex-col justify-center gap-3">
                              <textarea
                                value={data}
                                style={{ resize: "none" }}
                                rows={6}
                                className="text-sm bg-[transparent] border-b border-[#404242] outline-none focus:ring-0 text-gray-400 w-full p-2"
                                readOnly
                              />
                            </div>
                            <div className={"flex gap-2 mt-4 p-1.5"}>
                              <button
                                className="font-bold hover:cursor-pointer rounded w-full py-2 bg-[#FF1F40] hover:bg-[#BE0924] text-white text-sm px-4 text-center flex items-center justify-center false"
                                onClick={() => {
                                  if (!copyToClipboard(data)) {
                                    snackbar.enqueueSnackbar(
                                      "Clipboard not supported on your browser!",
                                      {
                                        variant: "error",
                                      }
                                    );
                                  }
                                  snackbar.enqueueSnackbar(
                                    "Copied to clipboard",
                                    {
                                      variant: "success",
                                    }
                                  );
                                }}
                              >
                                Copy to Clipboard
                              </button>
                              <button
                                className="bg-[#303633] scale-100 delay-100 transition text-sm text-center py-[7px] hover:bg-[#4A524E] w-full font-bold rounded"
                                onClick={() => {
                                  // download file
                                  const element = document.createElement("a");
                                  const file = new Blob([data], {
                                    type: "text/plain",
                                  });
                                  element.href = URL.createObjectURL(file);
                                  element.download = `${id}.txt`;
                                  document.body.appendChild(element); // Required for this to work in FireFox
                                  element.click();
                                  if (element.parentNode) {
                                    element.parentNode.removeChild(element);
                                  }
                                  snackbar.enqueueSnackbar("Downloaded file", {
                                    variant: "success",
                                  });
                                }}
                              >
                                Download file
                              </button>
                            </div>
                          </div>
                        )}
                        <div
                          className={`border-b border-[#404242] py-0 `}
                        ></div>
                        <div className="flex justify-between items-start">
                          <div className="flex w-full flex-col gap-3">
                            <div className="flex justify-between items-start">
                              <h1 className="text-xl font-bold">
                                Orders details
                              </h1>
                              <Link
                                className="text-xs font-semibold text-[#555555] hover:text-[#B1B5B6] mt-1 underline"
                                href={`/checkout/${order._id}`}
                              >
                                View checkout
                              </Link>
                            </div>
                            <div className="flex justify-between mt-2 gap-0 flex-wrap items-start">
                              <div>
                                <p className="text-sm text-[#99A29E]">Status</p>
                                <OrderStatus
                                  status={ordersWithProductData.status}
                                />
                              </div>
                              <div>
                                <p className="text-sm text-[#99A29E]">
                                  Warranty
                                </p>
                                <div>
                                  <WarrantyStatus />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-[#99A29E]">
                                  Replacement Granted
                                </p>
                                <div className="text-sm font-semibold">
                                  {ordersWithProductData.replacement ? (
                                    <span className={"text-green-500"}>
                                      Yes
                                    </span>
                                  ) : (
                                    <span className={"text-red-500"}>No</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-[#99A29E]">Order ID</p>
                              <p className="text-sm">{order._id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[#99A29E]">
                                Payment Method
                              </p>
                              <p className="text-sm">{order.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[#99A29E]">
                                Purchase Date
                              </p>
                              <p className="text-xs">
                                {formateDate(new Date(order?.timestamp))}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`border-b border-[#404242] py-0 `}
                        ></div>
                        <div className="flex flex-col gap-1">
                          <h1 className="text-xl font-bold">Actions</h1>
                          <button
                            onClick={() => {
                              return (window.location.href =
                                supportLink as string);
                            }}
                            className="flex hover:text-[#B1B5B6] gap-1 items-center"
                          >
                            <Question />
                            <p className="text-sm hover:text-[#B1B5B6]">
                              Ask for support
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

export default ViewOrderProductPage;

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
    console.log(context.query, "context.query");

    const { id, productId } = context.query;
    let orderId = new ObjectId(id as string);
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
      if (!user || user?._id.toString() !== order.user.toString()) {
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
    if (order.paymentMethod === "cashapp" && order.status === "pending") {
      showReceiptButton = await getSetting("cashAppReceiptChecking", true);
    }

    const orderProductIds = order.subOrders.map((order: any) => order.product);

    const ordersWithProductData = await ProductModel.findOne({
      _id: productId,
    })
      .then((product: any) => {
        const ordersWithProductData = order.subOrders.find(
          (order: any) => order.product === productId
        );

        return { ...ordersWithProductData, image: product.image };
      })
      .catch((error: Error) => {
        console.error(error);
      });
    return {
      props: {
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
