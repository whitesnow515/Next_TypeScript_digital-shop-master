import { ArrowRight, Cube, Info, Note, WarningCircle, X } from "phosphor-react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useCart } from "react-use-cart";
import { useOnClickOutside } from "usehooks-ts";
import { useSession } from "next-auth/react";
import { Switch } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { CartIcon } from "./ui/icon";
import { getSettingClient } from "@util/ClientUtils";
import CartItem from "./CartItem";

interface CartProps {
  open: boolean;
  ref_?: any;
  setOpen: (e: any) => void;
  setShowUserDropdown: (e: boolean) => void | any;
}
export default function Cart({
  open,
  ref_,
  setOpen,
  setShowUserDropdown,
}: CartProps): JSX.Element {
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const ref = useRef();
  const {
    isEmpty,
    totalUniqueItems,
    items,
    updateItemQuantity,
    removeItem,
    metadata,
    emptyCart,
  } = useCart();
  const [submitting, setsubmitting] = React.useState<boolean>(false);
  const session = useSession();
  const router = useRouter();
  const [useBal, setUseBal] = React.useState<boolean>(false);
  const [buttonScale, setButtonScale] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState<boolean>();
  const [errorMessage, setErrorMessage] = React.useState("");
  const [userBalance, setUserBalance] = React.useState(0);

  const cartAmount = items
    .map((x) => x.quantity && x.quantity * x.price)
    .reduce((a, b) => a && b && a + b, 0);

  const getCartAmout = (items: any) => {
    const cartAmount = items
      .map((x: any) => (x.quantity as number) * x.price)
      .reduce((a: any, b: any) => a + b, 0)
      .toFixed(2);

    return cartAmount;
  };

  const useBalance =
    userBalance >
    items
      .map((x) => (x.quantity as number) * x.price)
      .reduce((a, b) => a + b, 0);

  // useOnClickOutside(ref, () => setOpen(false))

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setButtonScale(false);
  }, [buttonScale]);

  if (!mounted) return null as any;

  return (
    <div className={""} ref={ref as any}>
      <div className={"relative"}>
        <div
          className="cursor-pointer hover:bg-[#303633] hover:rounded-full px-3 py-1 gap-1 flex items-center justify-center"
          onClick={() => {
            setOpen((e: any) => !e);
            setShowUserDropdown(false);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CartIcon />
          <span>Cart</span>
        </div>
        {items.length > 0 && (
          <div
            className={`bg-red-500 absolute ${
              isHovered ? "border-[#303633]" : "border-[#141716]"
            } border-2 left-[24px] top-1 rounded-full w-[16px] h-[16px] flex justify-center items-center text-center text-xs p-2`}
          >
            {/* {items.map((x) => x.quantity ?? 0).reduce((a, b) => a + b, 0) > 100
              ? "100+"
              : items
                  .map((x) => x.quantity)
                  .reduce((a, b) => a && b && a + b, 0)} */}
            {items.length > 100 ? "100+" : items.length}
          </div>
        )}
      </div>
      {open && <div onClick={() => setOpen(!open)} className="backdrop"></div>}
      <div
        style={{ zIndex: 10000 }}
        className={`absolute flex justify-center right-[0px] shadow-xl top-[70px] lg:right-[10px] max-lg:top-[60px] bg-[#1F2421] w-full md:w-[300px] rounded-3xl ${
          items.length === 0 && open ? "flex" : "hidden"
        }`}
      >
        <div className="float-right font-normal absolute top-0 right-4 mt-2 pr-0">
          {/* <button onClick={() => setOpen(false)}>
            <X />
          </button> */}
        </div>
        <div className="absolute right-[95px] top-[-150px] h-0 w-0 border-x-8 border-x-transparent border-b-[16px] border-b-[#404242] shadow-2xl max-lg:right-0"></div>
        <div className={"text-center p-5"}>
          <div className={"text-white mt-2 mb-2 font-bold text-2xl"}>
            Your cart is empty
          </div>
          <div
            className={
              "w-full m-auto text-[15px] text-gray-300 mt-1.5 opacity-50"
            }
          >
            Looks like you haven't added anything to your cart yet.
          </div>
          {router.pathname === "/products" ? (
            <button
              className={
                "bg-[#393F3C] hover:bg-[#4A524E] mt-5 font-semi-bold rounded-full w-max text-lg m-auto px-3 py-1.5 shadow-2xl shadow-black text-center"
              }
              onClick={() => setOpen(false)}
            >
              Browse Products
            </button>
          ) : (
            <Link onClick={() => setOpen(false)} href={"/products"}>
              <button
                className={
                  "bg-[#393F3C] hover:bg-[#4A524E] mt-5 font-semi-bold rounded-full w-max text-lg m-auto px-3 py-1.5 shadow-2xl shadow-black text-center"
                }
              >
                Browse Products
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* {items.length > 0 && open && ( */}
      <div
        style={{ zIndex: 10000 }}
        className={`absolute rounded-xl shadow-xl lg:right-[0px] lg:top-[55px] max-lg:right-[0px] ${
          !session.data ? "w-full lg:w-[460px]" : "xl:w-[405px]"
        }   max-lg:top-[60px] bg-[#1F2421]
            ${items.length > 0 && open ? "block" : "hidden"}
            `}
      >
        <div className="absolute right-[95px] top-[-125px] h-0 w-0 border-x-8 border-x-transparent border-b-[16px] border-b-[#404242] shadow-2xl max-lg:right-[15px]"></div>

        <div className={"rounded-3xl mx-auto w-full"}>
          <div className="relative">
            <CartItem
              cartHeight="400px"
              className="relative"
              items={items}
              updateItemQuantity={updateItemQuantity}
              removeItem={removeItem}
              totalPrice={getCartAmout(items)}
              isVisible={false}
            />
          </div>
          <div className={"flex flex-col px-4 gap-2 pb-2 pt-0 mt-2"}>
            {/* {userBalance >= getCartAmout(items) && (
                <>
                  {getCartAmout(items) !== 0 && (
                    <>
                      {useBal && (
                        <div
                          onClick={() => handleATC(false)}
                          className={`bg-blue-600 hover:cursor-pointer py-[7px]  text-sm w-full text-center rounded-md flex items-center gap-3 justify-center rounded-[6px] ${
                            items.length === 0 ||
                            submitting ||
                            (!session.data && "pointer-events-none opacity-40")
                          }`}
                        >
                          Confirm Order
                        </div>
                      )}
                    </>
                  )}
                </>
              )} */}
            <div className="flex items-center mt-2 pb-1 justify-between gap-2">
              {router.pathname === "/products" ? (
                <button
                  className={`bg-[#303633] ${
                    buttonScale ? "scale-110" : "scale-100 delay-100 transition"
                  } text-sm text-center py-[7px] hover:bg-[#4A524E] w-[49%] font-bold rounded-full`}
                  onClick={() => {
                    setButtonScale(true);
                    setOpen(false);
                  }}
                >
                  Keep shopping
                </button>
              ) : (
                <Link
                  className={`bg-[#303633] ${
                    buttonScale ? "scale-110" : "scale-100 delay-100 transition"
                  } text-sm text-center py-[7px] hover:bg-[#4A524E] w-[49%] font-bold rounded-full`}
                  href="/products"
                  onClick={() => {
                    setButtonScale(true);
                    setOpen(false);
                  }}
                >
                  Keep shopping
                </Link>
              )}
              <button
                onClick={() => {
                  setButtonScale(true);
                  router.push("/checkout");
                  setOpen(false);
                }}
                className={`${
                  !submitting
                    ? "text-black font-bold hover:cursor-pointer"
                    : "bg-[#BE0924] bg-[#c9cacb] hover:cursor-not-allowed text-gray-500"
                } bg-[#FF1F40] ${
                  buttonScale ? "scale-110" : "scale-100 delay-100 transition"
                } hover:bg-[#BE0924] text-white py-[7px] w-[49%] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center ${
                  items.length === 0 ||
                  (!session.data && "pointer-events-none opacity-40")
                }`}
                disabled={session.status !== "authenticated"}
              >
                {/* {submitting && (
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 mr-3 text-black animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
              )} */}
                Check out
                {/* <ArrowRight size={18} /> */}
              </button>
            </div>
            {useBal && (
              <div
                className={
                  "text-center  flex justify-center items-center gap-3 text-[#ffffff] text-sm mt-4"
                }
              >
                <Info size={20} /> Your balance will be used for this purchase
              </div>
            )}

            {session.status !== "authenticated" && (
              <p className="mt-2 text-sm text-center">
                <Link className="text-yellow-600" href="/auth/signin">
                  <u>Sign in</u>
                </Link>{" "}
                to continue checkout
              </p>
            )}
            {errorMessage !== "" && (
              <p className="text-center text-red-500 text-center">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* )} */}
    </div>
  );
}
