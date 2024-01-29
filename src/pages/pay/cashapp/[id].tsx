import React, { useEffect } from "react";

import { CircularProgress } from "@mui/material";
import axios from "axios";
import { ObjectId } from "bson";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { useSnackbar } from "notistack";
import Swal from "sweetalert2";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import {
  cleanSensitiveOrderData,
  OrderInterface,
} from "@app-types/models/order";
import CardPage from "@components/CardPage";
import CrispComponent from "@components/CrispComponent";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { getPendingOrderModel } from "@models/order";
import getUserModel from "@models/user";
import { debug, error } from "@util/log";
import { getSetting } from "@util/SettingsHelper";

export async function copyToClipboard(textToCopy: string): Promise<boolean> {
  async function workaround(): Promise<boolean> {
    // https://stackoverflow.com/questions/51805395/navigator-clipboard-is-undefined
    // Use the 'out of viewport hidden text area' trick
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;

    // Move textarea out of the viewport so it's not visible
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";

    document.body.prepend(textArea);
    textArea.select();

    let success = false;
    try {
      document.execCommand("copy");
      success = true;
    } catch (e) {
      error(e);
      success = false;
    } finally {
      textArea.remove();
    }
    return success;
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (e) {
      error(e);
    }
  }
  return workaround();
}

const CashAppPay = ({
  order,
  cashTag,
  qrCode,
  notSet,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const snackbar = useSnackbar();
  const [done, setDone] = React.useState(false);
  useEffect(() => {
    if (notSet) return;

    // using await here to "block the thread"
    async function pollServer() {
      try {
        debug("Polling server");
        const res = await axios.get(`/api/checkout/check/${order._id}/`);
        debug({ data: res.data });
        if (res.data.finished) {
          setDone(true);
          window.location.href = res.data.redirectUrl || "/pay/success/";
          return;
        }
        setTimeout(pollServer, 5000);
      } catch (e: any) {
        if (e.response?.data && e.response?.data?.rateLimit === true) {
          debug("Rate limited, retrying in 8 seconds");
          setTimeout(pollServer, 8000);
          return;
        }
        error(e);
        if (done) {
          return;
        }
        if (e.response?.data) {
          snackbar.enqueueSnackbar(e.response.data.message, {
            variant: "error",
          });
        }
        Swal.fire({
          title: "Error",
          text: "An error occurred while checking your order status. Please refresh the page.",
          icon: "error",
          confirmButtonText: "Refresh",
        }).then(() => {
          window.location.reload();
        });
      }
    }

    pollServer();
  }, []);

  function CopyText(props: { text: any; children?: any }) {
    return (
      <div className={"bg-[#141716] pt-1 pr-1 rounded pb-2 flex flex-row"}>
        <pre
          className={"pl-4 text-2xl overflow-auto mr-2 w-full"}
          style={{
            fontFamily: "monospace",
          }}
        >
          <span className={"pt-2 font-sans"}>{props.children}</span>
        </pre>
        <FormButton
          color={"gray"}
          className={"float-right rounded-lg p-1 right-0"}
          fullWidth={false}
          onClick={() => {
            if (typeof window === "undefined") return; // don't run on server
            if (!copyToClipboard(props.text)) {
              // no clipboard support
              snackbar.enqueueSnackbar(
                "Clipboard not supported on your browser!",
                {
                  variant: "error",
                }
              );
              return;
            }
            snackbar.enqueueSnackbar("Copied to clipboard", {
              variant: "success",
            });
          }}
        >
          Copy
        </FormButton>
      </div>
    );
  }

  return (
    <>
      <Meta title={"Pay with CashApp"} description={"Checkout with CashApp"} />
      <CrispComponent />
      <CardPage topTitleLink={""} topTitle={"Pay with CashApp"}>
        {notSet ? (
          <>
            <div className={"text-center"}>
              <h1 className={"text-4xl font-bold text-red-500"}>
                CashApp not set up
              </h1>
              <p className={"text-xl text-red-500"}>
                Please contact the administrators to set up CashApp.
              </p>
            </div>
          </>
        ) : (
          <>
            {qrCode.length > 1 && (
              <div
                className={"text-center"}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  src={qrCode}
                  width={200}
                  height={200}
                  alt={"CashApp QR Code"}
                />
              </div>
            )}

            <h1
              className={
                "text-4xl font-bold title-gradient text-center hover:cursor-pointer hover-circle"
              }
              onClick={() => {
                if (typeof window === "undefined") return; // don't run on server
                if (!copyToClipboard(cashTag)) {
                  // no clipboard support
                  snackbar.enqueueSnackbar(
                    "Clipboard not supported on your browser!",
                    {
                      variant: "error",
                    }
                  );
                } else {
                  snackbar.enqueueSnackbar("Copied to clipboard", {
                    variant: "success",
                  });
                }
              }}
            >
              ${cashTag}
            </h1>
            <div className={"text-white"}>
              <p className={"text-sm text-red-500 pb-4 text-center"}>
                Send the <span className={"font-bold"}>exact amount</span> to
                the Cash Tag above, and{" "}
                <span className={"font-bold"}>
                  include the Order ID below in the notes, and nothing else
                </span>
                . Otherwise your order may not be processed.
              </p>
              {order.shortId && order.shortId.includes(" ") && (
                <p className={"text-sm text-red-500 pb-4 text-center"}>
                  There are{" "}
                  <span className={"font-bold"}>
                    {order.shortId.split(" ").length}
                  </span>{" "}
                  words in the Order ID. Please ensure that you include all of
                  them.
                </p>
              )}
              <div className={""}>
                <small className={"text-gray-500"}>Total</small>
                <CopyText text={order.totalPriceStr}>
                  ${order.totalPriceStr}
                </CopyText>
              </div>
              <div className={"pt-4"}>
                <small className={"text-gray-500"}>
                  Order ID -{" "}
                  <span className={"font-bold text-red-500"}>
                    INCLUDE THIS AS THE NOTE.
                  </span>
                </small>
                <CopyText text={order.shortId?.toString()}>
                  {order.shortId}
                </CopyText>
              </div>
            </div>
            <div className={"text-center"}>
              <CircularProgress />
            </div>
            <FormButton
              href={`https://cash.app/$${cashTag}`}
              blankHref
              className={"my-4"}
            >
              Pay
            </FormButton>
            <small className={"pt-4 text-gray-500"}>
              If you leave this page, your order may not be completed. If you
              run into any issues, please contact us.
            </small>
          </>
        )}
      </CardPage>
    </>
  );
};

export default CashAppPay;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session: any = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  const allowGuest = await getSetting("guestOrders", false);
  if (!session && !allowGuest) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  // get the user id
  const UserModel = await getUserModel();
  const user: any = session
    ? await UserModel.findOne({
        username: session.user.name,
        email: session.user.email,
      })
    : null;
  if (!user && !allowGuest) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const userId = user?._id?.toString() || null;
  /*
  const redisKey = `order:${userId}`;
  const redisClient = await getRedisClient();
  const value = await redisClient.get(redisKey);
  if (!value) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const order: CheckoutOrderInterface = JSON.parse(
    value
  ) as CheckoutOrderInterface;
   */
  const { id } = context.query;
  const PendingOrderModel = await getPendingOrderModel();
  const order: OrderInterface = await PendingOrderModel.findOne({
    _id: new ObjectId(id as string),
  });
  if (!order) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  if (order.user) {
    // check if the user is the same
    if (order.user.toString() !== userId) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
  }
  if (order?.paymentMethod !== "CashApp") {
    // if the payment method is not cashapp, redirect to home
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  // delete order.notes;
  const cashTag = await getSetting("cashTag", "");
  const qrCode = await getSetting("cashAppQrCodeUrl", "");
  return {
    props: {
      order: cleanSensitiveOrderData(order),
      /*
      cashtag: process.env.CASHTAG || "set cashtag in .env",
      qrCode:
        (process.env.CASHAPP_QR_CODE_ENABLED === "true"
          ? process.env.CASHAPP_QR_CODE_URL
          : "") || "",
       */
      cashTag,
      qrCode,
      notSet: cashTag === "",
    },
  };
}
