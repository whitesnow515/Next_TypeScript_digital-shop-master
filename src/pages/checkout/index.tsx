import AppWrapper from "@components/AppWrapper";
import CartItem from "@components/CartItem";
import CheckoutPayment from "@components/CheckoutPayment";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import React, { useEffect } from "react";
import { useCart } from "react-use-cart";

//this is the checkout page
const Checkout = () => {
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
  const [promo, setPromo] = React.useState<string>("");
  const [isEmpty, setIsEmpty] = React.useState<boolean>(false);
  const [userBalance, setUserBalance] = React.useState(0);
  const { items, updateItemQuantity, removeItem } = useCart();
  const snackbar = useSnackbar();

  useEffect(() => {
    if (items.length === 0) {
      setIsEmpty(true);
    }
  }, [items]);

  useEffect(() => {
    if (session.status === "authenticated") {
      axios.get("/api/user/balance/").then((res) => {
        setUserBalance(res.data?.balance || 0);
      });
    }
  }, [session]);

  const handleATC = (
    use_crypto: boolean,
    orderConfirm?: boolean,
    currency?: string,
    use_bal?: boolean
  ) => {
    if (submitting) {
      return;
    }
    setsubmitting(true);
    axios
      .post("/api/checkout/atc/", {
        use_balance: use_bal,
        use_crypto,
        order_confirm: orderConfirm,
        currency,
        pending_order: false,
        items: items.map((x) => {
          return {
            productId: x.product._id,
            optionId: x._id,
            quantity: x.quantity,
          };
        }),
        promoCode: promo,
      })
      .then((data) => {
        router.push(`/checkout/${data.data?.orderId}`);
      })
      .catch((err) => {
        setsubmitting(false);
        if (!err.response.data.stock) {
          snackbar.enqueueSnackbar(err.response.data.message, {
            variant: "error",
          });
        } else {
          snackbar.enqueueSnackbar(
            "Something went wrong. Please try again later.",
            {
              variant: "error",
            }
          );
        }
      });
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
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="xl:w-[40%] w-full">
            <div className="border border-[#303633] md:h-[580px] bg-[#1F2421] relative py-7 px-10">
              <h1 className="text-white font-bold text-2xl my-2">
                Order Summary
              </h1>
              <CartItem
                cartHeight="375px"
                className="w-full"
                items={items}
                updateItemQuantity={updateItemQuantity}
                removeItem={removeItem}
                totalPrice={"$" + getCartAmout(items)}
                isVisible={true}
                setPromo={setPromo}
              />
            </div>
          </div>
          <div className="xl:w-[59%] w-full">
            <CheckoutPayment
              getCartAmout={getCartAmout}
              items={items}
              disableCashapp={getCartAmout(items) < 1}
              userBalance={userBalance}
              currency={currency}
              handleATC={handleATC}
              isEmpty={isEmpty}
              isVisible={true}
              setPromo={setPromo}
            />
          </div>
        </div>
      </div>
    </AppWrapper>
  );
};

export default Checkout;
