import { getSettingClient } from "@util/ClientUtils";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import OrderStatus from "./OrderStatus";

export default function CartItem({
  className,
  cartHeight,
  items,
  updateItemQuantity,
  removeItem,
  totalPrice,
  isVisible,
  orderDeatailRoute,
  setPromo,
}: any) {
  const [defaultImage, setDefaultImage] = useState("");
  const [mounted, setMounted] = useState<boolean>();
  const [PlusScaled, setPlusScaled] = React.useState(false);
  const [MinusScaled, setMinusScaled] = React.useState(false);
  const router = useRouter();
  useEffect(() => {
    getSettingClient("defaultImage", "/default.gif").then((img) => {
      setDefaultImage(img);
    });
  }, []);

  function getImageSrc(image: any) {
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

  const handleDecrease = (x: any) => {
    const min = x.minimum || 0; // Assuming 0 as default minimum if not specified
    if (x.quantity > min) {
      updateItemQuantity(x.id, x.quantity - 1);
    }
  };

  const handleIncrease = (x: any) => {
    const max = x.maximum ? Math.min(x.maximum, x.stock) : x.stock;
    if (x.quantity < max) {
      updateItemQuantity(x.id, x.quantity + 1);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !items) return null as any;
  return (
    <>
      <div
        className="overflow-y-auto overflow-x-hidden scrollbar-color"
        style={
          !isVisible
            ? { maxHeight: cartHeight && cartHeight }
            : { height: cartHeight && cartHeight }
        }
      >
        {items &&
          items.map((x: any, index: number) => (
            <>
              <div
                onClick={() => {
                  router.pathname !== "/checkout" && isVisible
                    ? router.push(
                        `/${orderDeatailRoute}/product/${x._id.toString()}`
                      )
                    : null;
                }}
                className={`flex w-full ${
                  !isVisible && index === 0 ? "rounded-t-xl" : ""
                } ${
                  !isVisible
                    ? "hover:bg-[#4A524E]"
                    : "border border-b hover:bg-[#303633] border-[#404242] cursor-pointer"
                } justify-between items-start gap-1 px-3 py-3`}
              >
                <div className={`flex w-full items-start gap-4`}>
                  <div className="w-[95px] shrink-0 h-[70px] ml-2 mr-2">
                    <img
                      className="w-full h-full lazy"
                      src={getImageSrc(x.product ? x.product.image : x.image)}
                    />
                  </div>
                  <div className="flex text-white flex-col w-full">
                    <div className="line-clamp-2 font-bold">
                      {/*<p>{x.product ? x.product.name : x.name}</p>*/}
                      <p className="text-sm">{x.name}</p>
                    </div>
                    <div className={"flex justify-between m-0.5 gap-2"}>
                      <div
                        className={`text-sm text-white text-dec opacity-50`}
                        style={{ textDecoration: "none" }}
                      >
                        {!isVisible
                          ? x.price
                            ? "$" + x.price.toFixed(2)
                            : "$" + x.options.price.toFixed(2)
                          : x.price
                          ? x.quantity > 1
                            ? x.quantity + " x $" + x.price.toFixed(2)
                            : "$" + x.price.toFixed(2)
                          : x.quantity > 1
                          ? "$" +
                            (x.options.price.toFixed(2) * x.quantity).toFixed(2)
                          : "$" + x.options.price.toFixed(2)}
                      </div>
                      {x?.status && (
                        <div>
                          <OrderStatus status={x?.status} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {router.pathname !== "/checkout/[orderId]" && (
                  <div
                    className={
                      "flex flex-col justify-between items-end h-[30px] md:h-[40px]"
                    }
                  >
                    {/*{isVisible && (*/}
                    {/*  <div*/}
                    {/*    onClick={(e) => {*/}
                    {/*      removeItem(x.id);*/}
                    {/*    }}*/}
                    {/*  >*/}
                    {/*    <img src="/assets/images/delete-icon.svg" />*/}
                    {/*  </div>*/}
                    {/*)}*/}
                    <div
                      className={`flex ${
                        !isVisible
                          ? "bg-[#141716] text-white"
                          : "bg-[#141716] text-white"
                      } rounded-full items-center`}
                    >
                      <button
                        onClick={() => {
                          setMinusScaled(!MinusScaled);
                          handleDecrease(x);
                        }}
                        className={`rounded-full px-2 cursor-pointer ${
                          MinusScaled ? "scale-120" : "scale-120"
                        }`}
                      >
                        -
                      </button>
                      <input
                        max={
                          x.maximum
                            ? x.maximum > x.stock
                              ? x.stock
                              : x.maximum
                            : x.stock
                        }
                        min={x.minimum ? x.minimum : undefined}
                        onChange={(e) => {
                          const max = x.maximum
                            ? Math.min(x.maximum, x.stock)
                            : x.stock;
                          const min = x.minimum || 0; // Assuming the minimum can default to 0 if not specified

                          let value = Math.max(
                            Math.min(parseInt(e.target.value, 10), max),
                            min
                          );

                          updateItemQuantity(x.id, value);
                        }}
                        // type="number"
                        className={`border-0 ${
                          isVisible
                            ? "text-white bg-[#141716]"
                            : "text-white bg-[#141716]"
                        } flex items-center justify-center text-center w-[30px] py-[0.3px]`}
                        value={x.quantity}
                      />
                      <button
                        onClick={() => {
                          setPlusScaled(!PlusScaled);
                          handleIncrease(x);
                        }}
                        className={`rounded-full px-2 cursor-pointer ${
                          PlusScaled ? "scale-120" : "scale-120"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {items.length > 1 && index !== items.length - 1 && <></>}
            </>
          ))}

        {items.length === 0 && (
          <div
            style={{ fontWeight: 400 }}
            className={"py-2 text-left text-sm text-gray-400"}
          >
            No items
          </div>
        )}
      </div>
      <div className={`${className} mx-auto left-0 right-0 bottom-0`}>
        <div className="flex justify-end">
          {router.pathname === "/checkout" && isVisible && (
            <input
              type="text"
              className="bg-transparent mb-2 border border-[#303633] outline-none focus:ring-0 rounded-md p-2 text-white"
              placeholder="Promo"
              onChange={(e) => setPromo(e.target.value)}
            />
          )}
        </div>
        {/* {getCartAmout(items) <= userBalance && items.length > 0 && ( */}
        <div
          className={`border-b-2 text-sm ${
            isVisible ? "border-[#404242] py-0" : "border-[#404242]"
          } items-center gap-3`}
        >
          {/* <h3 className="text-lg">Order Summary</h3>
          <p className="text-xs my-2">Select Payment Process</p>
          <div className="flex items-center gap-2 justify-between">
            <button
              disabled={items.length === 0}
              onClick={() => {
                setUseBal(false);
                setUseSellix(!useSellix);
              }}
              className={`${
                useSellix
                  ? "bg-white text-black font-bold flex gap-1 items-center rounded-full text-start px-3 py-2 w-[50%]"
                  : "bg-white text-black flex font-bold disabled:hover:cursor-not-allowed disabled:text-gray-500 gap-1 items-center rounded-full text-start px-3 py-2 w-[50%]"
              }`}
            >
              <div className="flex gap-1 items-center w-full">
                <img
                  className="w-5 h-5"
                  src="/assets/images/sellix-payment-icon.svg"
                />
                Sellix
              </div>
              {useSellix && (
                <img
                  className="w-5 h-5"
                  src="/assets/images/check.svg"
                  alt=""
                />
              )}
            </button>
            <button
              disabled={getCartAmout(items) > userBalance}
              onClick={() => {
                setUseBal(!useBal);
                setUseSellix(false);
              }}
              className={`${
                useBal
                  ? "bg-white text-black font-bold flex gap-1 items-center rounded-full text-start px-3 py-2 w-[50%]"
                  : "bg-white text-black disabled:hover:cursor-not-allowed disabled:text-gray-500 font-bold flex gap-1 hover:bg-[#ffffff] hover:text-black hover:font-bold items-center rounded-full text-start px-3 py-2 w-[50%]"
              }`}
            >
              <div className="flex gap-1 items-center w-full">
                <img
                  className="w-5 h-4"
                  src="/assets/images/balance-payment-icon.svg"
                />
                Balance
              </div>
              {useBal && (
                <img
                  className="w-5 h-5"
                  src="/assets/images/check.svg"
                  alt=""
                />
              )}
            </button>
          </div> */}
          {/* Use ${getCartAmout(items)} of your balance{" "}
                <Switch
                  disabled={getCartAmout(items) === 0}
                  checked={useBal}
                  onChange={(e) => setUseBal((y) => !y)}
                /> */}
        </div>
        {/* )} */}

        {isVisible && (
          <div
            className={
              "w-full text-[14px] px-2 text-white justify-between items-center py-4 bg-[#1F2421] flex"
            }
          >
            <div className={"font-normal max-lg:text-sm"}>Total Cost</div>
            <div className={"font-semibold max-lg:text-sm"}>{totalPrice}</div>
          </div>
        )}
      </div>
    </>
  );
}
