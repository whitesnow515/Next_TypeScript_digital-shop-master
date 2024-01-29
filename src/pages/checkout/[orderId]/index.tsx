import AppWrapper from "@components/AppWrapper";
import CartItem from "@components/CartItem";
import { Skeleton } from "@mui/material";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "react-use-cart";
import QRCode from "qrcode.react";
import moment from "moment";
import Swal from "sweetalert2";
import Success from "@components/order/Success";
import { getSetting } from "@util/SettingsHelper";
import { completeStatus, pendingStatus } from "@root/currency";
import PaymentTimer from "@components/PaymentTimer";

const ReverseTimer = ({ orderTimestamp }: any) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const expirationTime = moment(orderTimestamp).add(8, "hour");
    const difference = expirationTime.diff(moment());
    const duration = moment.duration(difference);

    const hours = Math.max(0, duration.hours());
    const minutes = Math.max(0, duration.minutes());
    const seconds = Math.max(0, duration.seconds());

    return {
      hours,
      minutes,
      seconds,
    };
  }

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [orderTimestamp]);

  const formattedTime = `${String(timeLeft.hours).padStart(2, "0")}:${String(
    timeLeft.minutes
  ).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")}`;
  return (
    <div>
      <p
        className={`${
          timeLeft.minutes > 0 ? "text-[#2BF627]" : "text-[#FF3333]"
        } flex items-center gap-1`}
      >
        {timeLeft.minutes > 0 ? (
          <img src="/assets/images/clock-green.svg" />
        ) : (
          <img src="/assets/images/clock-red.svg" />
        )}
        {formattedTime}
      </p>
    </div>
  );
};

const index = ({
  orderId,
  cashTag,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  let currency = [
    {
      coin: "BTC",
      logo: "/assets/images/btc-logo.svg",
      value: "BITCOIN",
    },
    {
      coin: "LTC",
      logo: "/assets/images/ltc-logo.svg",
      value: "LITECOIN",
    },
    {
      coin: "ETH",
      logo: "/assets/images/ethereum-logo.svg",
      value: "ETHEREUM",
    },
    {
      coin: "DOGE",
      logo: "/assets/images/doge-logo.svg",
      value: "DOGE",
    },
    {
      coin: "BCH",
      logo: "/assets/images/bch-logo.svg",
      value: "BITCOIN_CASH",
    },
    {
      coin: "USDC",
      logo: "/assets/images/usdc-logo.svg",
      value: "USDC:ERC20",
    },
    {
      coin: "CASH APP",
      logo: "/assets/images/cashapp.png",
      value: "CASH_APP",
    },
  ];
  const [submitting, setsubmitting] = React.useState<boolean>(false);
  const router = useRouter();
  const [isExpire, setIsExpire] = React.useState<boolean>();
  const [isDelete, setIsDelete] = React.useState<boolean>(false);
  const [initialFetch, setInitialFetch] = useState(true);
  const [confirmBalance, setConfirmBalance] = React.useState(false);
  const [iscopy, setIsCopy] = React.useState(false);
  const [iscopyCashtag, setIsCopyCashTag] = React.useState(false);
  const [iscopy1, setIsCopy1] = React.useState(false);
  const [paymentinfo, setPaymentinfo] = React.useState<any>();
  const { items, emptyCart } = useCart();
  const snackbar = useSnackbar();
  const [mounted, setMounted] = useState<boolean>();
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const dueRef = useRef<HTMLTextAreaElement>(null);
  const cashTagRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    handleRequest();
  }, [mounted, confirmBalance]);

  const handleRequest = () => {
    if (mounted) {
      setsubmitting(true);
      axios
        .get(`/api/checkout/sellix/${orderId}`)
        .then((data) => {
          setsubmitting(false);
          setPaymentinfo(() => {
            const updatedPaymentinfo = data.data.data;
            setIsExpire(updatedPaymentinfo?.expire);
            setInitialFetch(false);
            if (updatedPaymentinfo?.paid) {
              emptyCart();
            }
            return updatedPaymentinfo;
          });
        })
        .catch((err) => {
          setsubmitting(false);
          setInitialFetch(false);
          snackbar.enqueueSnackbar(err.response.data.message, {
            variant: "error",
          });
        });
    }
  };
  const currencyLogo = currency.find(
    (data) =>
      data.value.toLowerCase() === paymentinfo?.paymentMethod.toLowerCase()
  );
  const getCartAmout = (items: any) => {

    const cartAmount = items
      .map((x: any) => (x.quantity as number) * x.options.price)
      .reduce((a: number, b: number) => a + b, 0)
      .toFixed(2);

    return cartAmount;
  };

  const orderInfo = () => {
    return (
      <>
        <div
          className={`border border-[#303633] ${
            paymentinfo.paymentMethod.toLowerCase() !== "cash_app"
              ? "h-[580px]"
              : "h-full"
          } text-white bg-[#1F2421] relative py-5 px-10`}
        >
          <h1 className="text-white font-bold text-2xl my-2">Order details</h1>
          <div>
            <h1 className={"font-bold text-[#99a29e]"}>Email</h1>
            <p className="mb-3">{paymentinfo?.email}</p>
          </div>
          <div>
            <h1 className={"font-bold text-[#99a29e]"}>Payment Method</h1>
            <p className="mb-3">
              {paymentinfo.paymentMethod !== "Balance"
                ? currencyLogo?.coin
                : "Balance"}
            </p>
          </div>
          <div>
            <h1 className={"font-bold text-[#99a29e]"}>Order id</h1>
            <p className="mb-4">{orderId}</p>
          </div>
          <CartItem
            cartHeight={
              paymentinfo.paymentMethod.toLowerCase() !== "cash_app"
                ? "250px"
                : "330px"
            }
            className="w-[100%]"
            orderDeatailRoute={`/orders/${orderId}`}
            items={paymentinfo?.orderItems}
            totalPrice={
              paymentinfo.paymentMethod.toLowerCase() !== "balance"
                ? paymentinfo.paymentMethod.toLowerCase() === "cash_app"
                  ? "$" + paymentinfo?.due
                  : paymentinfo?.due + " " + currencyLogo?.coin
                : "$" + paymentinfo?.due
            }
            isVisible={true}
          />
        </div>
      </>
    );
  };

  const handleCashtagCopyClick = () => {
    if (cashTagRef.current) {
      cashTagRef.current.select();
      document.execCommand("copy");
      setIsCopyCashTag(true);
      (window.getSelection() as any).removeAllRanges();
    }
  };
  const handleCopyClick = () => {
    if (addressRef.current) {
      addressRef.current.select();
      document.execCommand("copy");
      setIsCopy(true);
      (window.getSelection() as any).removeAllRanges();
    }
  };
  const handleCopy1Click = () => {
    if (dueRef.current) {
      const range = document.createRange();
      range.selectNodeContents(dueRef.current);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        try {
          document.execCommand("copy");
          setIsCopy1(true);
        } catch (err) {
          console.error("Copy failed:", err);
        }

        selection.removeAllRanges();
      }
    }
  };
  useEffect(() => {
    // If isExpire becomes true, fetch the API again after 10 seconds
    if (initialFetch) {
      setsubmitting(true);
    }
    let intervalId: any;
    intervalId = setInterval(() => {
      if (
        (paymentinfo &&
          !paymentinfo?.paid &&
          paymentinfo.paymentMethod !== "Balance" &&
          !isDelete) ||
        pendingStatus.includes(paymentinfo?.paymentPaid) ||
        !completeStatus.includes(paymentinfo?.paymentPaid) ||
        paymentinfo.paymentPaid !== "COMPLETED" ||
        isExpire
      ) {
        handleRequest();
      } else {
        clearInterval(intervalId);
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isExpire, initialFetch, paymentinfo]);
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setIsCopy(false);
      setIsCopyCashTag(false);
    }, 500);

    return () => {
      clearInterval(timerInterval);
    };
  }, [iscopy, iscopyCashtag]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setIsCopy1(false);
    }, 500);

    return () => {
      clearInterval(timerInterval);
    };
  }, [iscopy1]);

  const handleConfirmOrder = () => {
    if (submitting) {
      return;
    }
    setsubmitting(true);
    setConfirmBalance(true);
    axios
      .post("/api/checkout/balance/", {
        use_balance: true,
        order_confirm: true,
        orderId,
      })
      .then((data) => {
        // Delay showing the "Success" component for 10 seconds
        const timer = setTimeout(() => {
          setConfirmBalance(false);
        }, 10000);
        setsubmitting(false);
        // setInitialFetch(true);
        // router.push(data.data.paymentUrl);
        emptyCart();
        // router.push(`/checkout/${data.data?.orderId}`);

        // emptyCart();
      })
      .catch((err) => {
        setsubmitting(false);
        setConfirmBalance(false);
        snackbar.enqueueSnackbar(
          "Something went wrong. Please try again later.",
          {
            variant: "error",
          }
        );
      });
  };

  if (!mounted) return null as any;
  return (
    <AppWrapper>
      <div className="w-[87%] mx-auto mt-8">
        {initialFetch ? (
          <div className="w-full flex flex-wrap gap-3">
            <div className="border hidden xl:flex w-full flex-col gap-5 border-[#303633] xl:w-[40%] h-auto text-white bg-[#1F2421] relative py-5 px-10">
              <div className="w-[40%]">
                <Skeleton variant="text" sx={{ fontSize: "2rem" }} />
              </div>
              <div className="w-full flex gap-2 items-center">
                <div>
                  <Skeleton variant="rectangular" width={40} height={40} />
                </div>
                <div className="w-full">
                  <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                  <Skeleton width={140} variant="text" />
                </div>
              </div>
              <div className="border-[#404242] border-b"></div>
              <div className="w-[30%]">
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </div>
            </div>
            <div className="border flex flex-col gap-5 border-[#303633] w-full xl:w-[58%] h-auto text-white bg-[#1F2421] relative py-5 px-10">
              <div className="w-[40%]">
                <Skeleton variant="text" sx={{ fontSize: "2rem" }} />
              </div>
              <div className="w-full flex flex-col gap-2 items-center">
                <div>
                  <Skeleton variant="rectangular" width={250} height={250} />
                </div>
              </div>
              <div className="w-[50%]">
                <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                <Skeleton width={140} variant="text" />
              </div>
              <div className="w-[50%]">
                <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
              </div>
              <div className="w-[30%]">
                <Skeleton variant="text" />
                <Skeleton className="mt-5" variant="text" />
              </div>
            </div>
            <div className="border flex xl:hidden w-full flex-col gap-5 border-[#303633] xl:w-[40%] h-auto text-white bg-[#1F2421] relative py-5 px-10">
              <div className="w-[40%]">
                <Skeleton variant="text" sx={{ fontSize: "2rem" }} />
              </div>
              <div className="w-full flex gap-2 items-center">
                <div>
                  <Skeleton variant="rectangular" width={40} height={40} />
                </div>
                <div className="w-full">
                  <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                  <Skeleton width={140} variant="text" />
                </div>
              </div>
              <div className="#404242"></div>
              <div className="w-[30%]">
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </div>
            </div>
            {/* <div className="xl:w-[40%] bg-[#1F2421] hidden xl:block  w-full">
              <div className="w-[20%]">
                <Loader />
              </div>
              <div className="w-[20%]">
                <Loader />
                <Loader />
              </div>

              <div className="w-[20%]">
                <Loader />
                <Loader />
              </div>
            </div> */}
          </div>
        ) : (
          <>
            {paymentinfo ? (
              <>
                <div
                  className={`flex flex-wrap ${
                    paymentinfo.paymentMethod.toLowerCase() !== "cash_app" &&
                    "items-center"
                  }  justify-between`}
                >
                  <div className="xl:w-[40%] bg-[#1F2421] hidden xl:block w-full">
                    {orderInfo()}
                  </div>
                  <div className="xl:w-[59%] w-full">
                    <div
                      className={`relative p-5 ${
                        isExpire && "flex flex-col justify-center"
                      } items-center border border-[#303633] ${
                        paymentinfo.paymentMethod.toLowerCase() !== "cash_app"
                          ? "overflow-hidden xl:h-[580px] p-5"
                          : "h-[100%]"
                      } bg-[#1F2421] `}
                    >
                      {paymentinfo.paymentMethod === "Balance" ? (
                        <div className="h-[100%] mb-12">
                          {confirmBalance ? (
                            <>
                              <div className="text-center h-[60%] mt-4 text-white justify-center flex flex-col items-center">
                                <span className="loader"></span>
                                <h1 className="font-bold mt-6 text-2xl">
                                  Delivery is in progress
                                </h1>
                                <p className="text-white text-sm mt-1">
                                  Waiting for delivery confirmation
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              {paymentinfo.paid ? (
                                <>
                                  <Success orderId={orderId} />
                                </>
                              ) : (
                                <>
                                  <h1 className="text-white font-bold text-2xl">
                                    Payment
                                  </h1>
                                  <div className="flex flex-col gap-5 mt-4 text-white justify-center items-center h-[60%]">
                                    <div className="text-center">
                                      <h1 className="font-bold text-3xl">
                                        Final confirmation
                                      </h1>
                                      <p className="text-sm">
                                        Please verify that your order is correct
                                      </p>
                                    </div>
                                    <button
                                      disabled={submitting}
                                      onClick={() => handleConfirmOrder()}
                                      className="text-white font-bold hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] w-[35%] text-sm text-center rounded-full flex items-center gap-3 justify-center p-2 mt-3 hover:opacity-[0.8]"
                                    >
                                      Confirm Order
                                    </button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {isExpire ? (
                            <div className="flex flex-col gap-10 w-[80%] mx-auto justify-center items-center">
                              <div className="flex flex-col mx-auto text-center items-center justify-center">
                                <img
                                  className="w-16 h-16 pb-2"
                                  src="/assets/images/clock-red.svg"
                                />
                                <h1 className="text-white text-2xl font-bold mt-4 mb-4">
                                  Payment not received on time
                                </h1>
                                <p className="text-sm text-[#f0f2f5] w-full">
                                  Unfortunately we did not receive a payment in
                                  the time window assigned. Please recreate this
                                  order and you’ll get a new address and a price
                                  quote.
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDelete(true);
                                    return Swal.fire({
                                      title:
                                        "Are you sure you want to recreate your order?",
                                      text: "This action cannot be undone.",
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonColor: "#d33",
                                      cancelButtonColor: "#3085d6",
                                    }).then((r) => {
                                      if (r.isConfirmed) {
                                        axios
                                          .delete(
                                            `/api/orders/delete_pending_order/${orderId}`
                                          )
                                          .then((res) => {
                                            if (res.data.success) {
                                              setIsDelete(false);
                                              router.push(`/checkout`);
                                            }
                                          })
                                          .catch((eX) => {
                                            if (eX.response) {
                                              setIsDelete(false);
                                              snackbar.enqueueSnackbar(
                                                eX.response.data.message,
                                                {
                                                  variant: "error",
                                                }
                                              );
                                            }
                                          });
                                      }
                                    });
                                  }}
                                  className="bg-[#393F3C] mt-4 hover:bg-[#4A524E] rounded-full text-white font-bold px-4 py-2"
                                >
                                  Recreate Order
                                </button>
                              </div>
                              <div
                                className="text-white flex flex-col p-4 rounded-xl bg-[#303633] items-start gap-3"
                                data-padded="true"
                                data-onclick="false"
                              >
                                <svg
                                  className="b-PCQCxp"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  ></path>
                                  <path
                                    d="M12 16V12"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  ></path>
                                  <path
                                    d="M12 8H12.01"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  ></path>
                                </svg>
                                <div className="b-FG4XDA text-sm">
                                  <p className="b-RwfI_t">
                                    If you did already send a payment
                                  </p>
                                  <p className="b-RwfI_t">
                                    Please keep this screen open, once we detect{" "}
                                    <br />
                                    it on the network we will show you your
                                    <br /> options.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {paymentinfo.paid ? (
                                <div className="flex flex-col gap-5 h-[100%] w-[80%] mx-auto justify-center items-center text-white">
                                  {/* <p>{paymentinfo.paymentPaid}</p> */}
                                  {paymentinfo.paid &&
                                  pendingStatus.includes(
                                    paymentinfo.paymentPaid
                                  ) &&
                                  paymentinfo.paymentPaid !== "PENDING" ? (
                                    <>
                                      <div className="text-center h-[60%] mt-4 text-white justify-center flex flex-col items-center">
                                        <div className="loader1"></div>
                                        <h1 className="font-bold mt-4 text-2xl">
                                          Payment detected
                                        </h1>
                                        <p className="text-white text-sm mt-2 mb-10 w-[70%]">
                                          We have detected your payment of{" "}
                                          <a className={"font-bold"}>
                                            {paymentinfo?.due}
                                          </a>{" "}
                                          {paymentinfo?.coin} and are waiting
                                          for it to be confirmed on the network.
                                          You may continue{" "}
                                          <a
                                            className={"font-bold underline"}
                                            href={"/products"}
                                          >
                                            browser & buy products.
                                          </a>{" "}
                                          We will send you an email once
                                          confirmed.
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <Success orderId={orderId} />
                                    </>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2 justify-center">
                                    <h1 className="text-white font-bold text-center text-3xl">
                                      Pay with {currencyLogo?.coin}
                                    </h1>
                                    <img
                                      className="w-9 h-9"
                                      src={currencyLogo?.logo as string}
                                    />
                                  </div>
                                  {/* {paymentinfo.paymentMethod !== "cashapp" && ( */}
                                  <div className="flex items-center mb-3  gap-2 justify-center p-4">
                                    <div className={"rounded-xl p-4 bg-white"}>
                                      <QRCode
                                        value={paymentinfo?.qrcode}
                                        imageSettings={{
                                          src: currencyLogo?.logo as string,
                                          height: 40,
                                          width: 40,
                                          excavate: false,
                                        }}
                                        size={200}
                                        level="H"
                                        markerWidth={1}
                                        markerHeight={1}
                                        markerMid="1"
                                        maskUnits={1}
                                        markerStart="1"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3 text-white">
                                    <div className="flex flex-col mt-5 gap-7">
                                      {/* CashTag */}
                                      {paymentinfo.paymentMethod.toLowerCase() ===
                                        "cash_app" && (
                                        <div className="flex justify-between gap-5 items-center">
                                          <div className="w-[80%]">
                                            <h1 className="font-bold">
                                              Cashtag Address
                                            </h1>
                                            {/* <p ref={addressRef}>{paymentinfo?.address}</p> */}
                                            <input
                                              className="bg-transparent outline-none ring-0 w-full"
                                              ref={cashTagRef as any}
                                              value={paymentinfo.cashTag}
                                              onClick={handleCashtagCopyClick}
                                              readOnly
                                            />
                                          </div>
                                          <div>
                                            <button
                                              onClick={handleCashtagCopyClick}
                                              className="bg-[#393F3C] font-bold hover:bg-[#4A524E] px-6 py-1 flex items-center justify-center gap-1 rounded-full"
                                            >
                                              {!iscopyCashtag ? (
                                                <>
                                                  Copy
                                                  <img
                                                    className="w-5 h-5"
                                                    src="/assets/images/copy.svg"
                                                  />
                                                </>
                                              ) : (
                                                <>Copied</>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex justify-between gap-5 items-center">
                                        <div className="w-[80%]">
                                          <h1 className="font-bold">
                                            {paymentinfo.paymentMethod.toLowerCase() ===
                                            "cash_app" ? (
                                              <>
                                                {"CashApp note ("}
                                                <span className="text-[#99A29E]">
                                                  include in note
                                                </span>
                                                {")"}
                                              </>
                                            ) : (
                                              "Payment Unique Address"
                                            )}
                                          </h1>
                                          {/* <p ref={addressRef}>{paymentinfo?.address}</p> */}
                                          <input
                                            className="bg-transparent outline-none ring-0 w-full"
                                            ref={addressRef as any}
                                            value={paymentinfo?.address}
                                            onClick={handleCopyClick}
                                            readOnly
                                          />
                                        </div>
                                        <div>
                                          <button
                                            onClick={handleCopyClick}
                                            className="bg-[#393F3C] font-bold hover:bg-[#4A524E] px-6 py-1 flex items-center justify-center gap-1 rounded-full"
                                          >
                                            {!iscopy ? (
                                              <>
                                                Copy
                                                <img
                                                  className="w-5 h-5"
                                                  src="/assets/images/copy.svg"
                                                />
                                              </>
                                            ) : (
                                              <>Copied</>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      <div
                                        className={
                                          "flex justify-between items-center"
                                        }
                                      >
                                        <div>
                                          <h1 className="font-bold">
                                            Amount to pay
                                          </h1>
                                          {/*<p>{paymentinfo?.due + " " + currencyLogo?.coin}</p>*/}
                                          <div className={"flex gap-0"}>
                                            <div
                                              className="bg-transparent outline-none"
                                              ref={dueRef as any}
                                              onClick={handleCopy1Click}
                                            >
                                              {paymentinfo.due}
                                            </div>
                                            {paymentinfo.paymentMethod.toLowerCase() ===
                                            "cash_app" ? (
                                              "$"
                                            ) : (
                                              <p className="ml-[1px]">{currencyLogo?.coin}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <button
                                            onClick={handleCopy1Click}
                                            className="bg-[#393F3C] font-bold hover:bg-[#4A524E] px-6 py-1 flex items-center justify-center gap-1 rounded-full"
                                          >
                                            {!iscopy1 ? (
                                              <>
                                                Copy
                                                <img
                                                  className="w-5 h-5"
                                                  src="/assets/images/copy.svg"
                                                />
                                              </>
                                            ) : (
                                              <>Copied</>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="w-full text-[14px] text-white justify-between items-center py-5 bg-[#1F2421] flex border-t border-[#303633]">
                                        <h1 className="">Expires in</h1>
                                        <PaymentTimer
                                          orderTimestamp={
                                            paymentinfo && paymentinfo.timestamp
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="xl:w-[40%] mt-4 h-full block xl:hidden w-full">
                    {orderInfo()}
                  </div>
                </div>
                {/* ) : (

            )} */}
              </>
            ) : (
              <p className="text-white">Order details Not found</p>
            )}
          </>
        )}
      </div>
    </AppWrapper>
  );
};

export default index;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { orderId } = context.query;
  const cashTag = await getSetting("cashTag", "");

  return {
    props: {
      orderId,
      cashTag,
    },
  };
}
