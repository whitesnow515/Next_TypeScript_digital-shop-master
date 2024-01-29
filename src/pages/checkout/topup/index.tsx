import AppWrapper from "@components/AppWrapper";
import CartItem from "@components/CartItem";
import CheckoutPayment from "@components/CheckoutPayment";
import { Snackbar, Switch } from "@mui/material";
import { getSettingClient } from "@util/ClientUtils";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import React, { useEffect } from "react";
import { useCart } from "react-use-cart";

const Topup = () => {
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
  ];
  const session = useSession();
  const [submitting, setsubmitting] = React.useState<boolean>(false);
  const router = useRouter();
  const [useBal, setUseBal] = React.useState<any>();
  const [isEmpty, setIsEmpty] = React.useState<boolean>(false);
  const [userBalance, setUserBalance] = React.useState(0);
  const { items, updateItemQuantity, removeItem } = useCart();
  const snackbar = useSnackbar();
  let state =
    typeof window !== "undefined"
      ? window.localStorage.getItem("topup")
      : false;

  useEffect(() => {
    setUseBal(localStorage.getItem("topup"));
  }, [useBal, state]);

  const handleATC = async (
    useBal: boolean,
    useCrypto: boolean,
    currency: string
  ) => {
    try {
      // setSubmitting(true);
      let amount = localStorage.getItem("topup");

      await axios
        .post(`/api/top-up/`, {
          amount: parseFloat(amount as string),
          currency: currency,
        })
        .then((data) => {
          router.push(`/checkout/topup/${data.data.orderId}`);
        })
        .catch((err) => {
          snackbar.enqueueSnackbar(err.response.data.message, {
            variant: "error",
          });
        });

      //   window.location.replace(paymentUrl);

      //   setSubmitting(false);
      //   setVerified(true);
    } catch (e) {
      //   setSubmitting(false);
    }
  };

  const getCartAmout = (items: any) => {
    const cartAmount = items
      .map((x: any) => (x.quantity as number) * x.price)
      .reduce((a: any, b: any) => a + b, 0)
      .toFixed(2);

    return cartAmount;
  };

  return (
    <AppWrapper>
      <div className="w-[87%] mx-auto mt-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="xl:w-[40%] hidden xl:block w-full">
            <div className="border text-white border-[#303633] h-[580px] bg-[#1F2421] relative py-7 px-10">
              <h1 className="text-white font-bold text-2xl my-2">
                Top Up Summary
              </h1>
              <p>Total amount</p>
              <p className="font-bold">${Number(useBal).toFixed(2)}</p>
            </div>
          </div>
          <div className="xl:w-[59%] w-full">
            {/* getCartAmout, items, userBalance, handleATC, currency, isEmpty, */}
            <CheckoutPayment
              getCartAmout={getCartAmout}
              items={items}
              userBalance={userBalance}
              currency={currency}
              handleATC={handleATC}
              disableCashapp={!useBal || Number(useBal) < 1}
              isEmpty={!useBal || Number(useBal) === 0}
              isVisible={false}
            />
          </div>
          <div className="xl:w-[40%] mt-4 block xl:hidden w-full">
            <div className="border text-white border-[#303633] h-auto bg-[#1F2421] relative py-5 px-6">
              <h1 className="text-white font-bold text-2xl my-2">
                Topup Summary
              </h1>
              <p>Total amount</p>
              <p className="font-bold">${Number(useBal).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
};

export default Topup;
