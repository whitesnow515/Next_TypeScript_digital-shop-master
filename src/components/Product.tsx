import React, { useRef } from "react";

import FormButton from "@components/FormButton";
import useOnScreen from "@util/ClientUtils";
import Link from "next/link";

type ProductPropsInterface = {
  name: string;
  stock?: number;
  price: number;
  image?: string;
  legacyImage?: boolean;
  defaultImage?: string;
  featured?: boolean;
  orderProduct?: boolean;
  orderId?: any;
  productId?: string;
  oos?: any;
};

const Product = ({
  name,
  stock,
  price,
  image,
  legacyImage,
  defaultImage,
  featured,
  oos,
  orderProduct,
  orderId,
  productId,
}: ProductPropsInterface) => {
  function getImageSrc() {
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

  const ref = useRef(null);
  const isVisible = useOnScreen(ref);
  if (orderProduct) {
    return (
      <Link
        className={"w-full"}
        href={`/orders/${orderId}/product/${productId}`}
      >
        <div ref={ref} className={`flex flex-col w-full`}>
          <div
            className={`flex items-center relative transition transition-transform hover:-translate-y-1 duration-300 ease-in-out  product-images-container justify-center w-full`}
          >
            {(image || defaultImage) && (
              <img
                src={getImageSrc() as string}
                alt={name}
                className={`object-cover w-full h-full ${
                  legacyImage ? "w-full h-full" : "xs:w-full"
                }`}
              />
            )}
          </div>
          <div
            className={`flex-none flex justify-between items-center w-full h-max mt-2`}
          >
            <div className={"flex flex-col md:gap-1"}>
              {/*<div className={'bg-red-800 text-xs p-0.5 box-border rounded-md px-3 flex items-center gap-3 text-red-400 flex items-center gap-3'}>*/}
              {/*  <div className={'w-3 h-3 bg-red-500 rounded-full'}/>*/}
              {/*  Out of stock*/}

              {/*</div>*/}
              <span className="text-white md:text-lg xl:text-xl line-clamp-2 font-bold">
                {name}
              </span>
              <div className={"text-[#75817B] md:text-md"}>
                ${price?.toFixed(2)}
              </div>
              {/* {oos && (
              <div className={"text-sm mt-1 text-gray-500"}>
                No options available
              </div>
            )} */}
            </div>
          </div>
        </div>
      </Link>
    );
  } else {
    if (oos) {
      return (
        <div ref={ref} className={`flex flex-col w-full`}>
          <div
            className={`flex items-center transition transition-transform hover:-translate-y-2 duration-300 ease-in-out relative product-images-container justify-center w-full`}
          >
            {oos ? (
              <button className="absolute z-10 top-[5%] left-2 text-[10px] md:text-[9px] bg-orange-500 text-white rounded-full px-2 py-1">
                Out of Stock
              </button>
            ) : featured ? (
              <button className="absolute z-10 top-[5%] left-2 text-[10px] md:text-[9px] bg-black text-white rounded-full px-2 py-1">
                Featured
              </button>
            ) : null}

            {(image || defaultImage) && (
              <img
                src={getImageSrc() as string}
                alt={name}
                className={`object-cover w-full h-full ${
                  legacyImage ? "w-full h-full" : "xs:w-full"
                }`}
              />
            )}
          </div>
          <div
            className={`flex-none flex justify-between items-center w-full h-max mt-2`}
          >
            <div className={"flex flex-col md:gap-1"}>
              {/*<div className={'bg-red-800 text-xs p-0.5 box-border rounded-md px-3 flex items-center gap-3 text-red-400 flex items-center gap-3'}>*/}
              {/*  <div className={'w-3 h-3 bg-red-500 rounded-full'}/>*/}
              {/*  Out of stock*/}

              {/*</div>*/}
              <span className="text-white md:text-lg xl:text-xl line-clamp-2 font-bold">
                {name}
              </span>
              {!oos && (
                <div className={"text-[#75817B] md:text-md"}>
                  ${price.toFixed(2)}
                </div>
              )}
              {/* {oos && (
              <div className={"text-sm mt-1 text-gray-500"}>
                No options available
              </div>
            )} */}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link className={"w-full"} href={`/product/${encodeURIComponent(name)}`}>
        <div ref={ref} className={`flex flex-col w-full`}>
          <div
            className={`flex items-center relative transition transition-transform hover:-translate-y-2 duration-300 ease-in-out  product-images-container justify-center w-full`}
          >
            {oos ? (
              <button className="absolute z-10 top-4 left-2 text-[9px] md:text-[9px] bg-orange-500 text-white rounded-full px-2 py-1">
                Out of Stock
              </button>
            ) : featured ? (
              <button className="absolute z-10 top-[6%] md:top-[5%] left-2 text-[8px] md:text-[9px] bg-black text-white rounded-full px-2 py-1">
                Featured
              </button>
            ) : null}
            {(image || defaultImage) && (
              <img
                src={getImageSrc() as string}
                alt={name}
                className={`object-cover w-full h-full`}
              />
            )}
          </div>
          <div
            className={`flex-none flex justify-between items-center w-full h-max mt-2`}
          >
            <div className={"flex flex-col md:gap-1"}>
              {/*<div className={'bg-red-800 text-xs p-0.5 box-border rounded-md px-3 flex items-center gap-3 text-red-400 flex items-center gap-3'}>*/}
              {/*  <div className={'w-3 h-3 bg-red-500 rounded-full'}/>*/}
              {/*  Out of stock*/}

              {/*</div>*/}
              <span className="text-white md:text-lg xl:text-xl line-clamp-2 font-bold">
                {name}
              </span>
              {!oos && (
                <div className={"text-[#75817B] md:text-md"}>
                  ${price?.toFixed(2)}
                </div>
              )}
              {/* {oos && (
              <div className={"text-sm mt-1 text-gray-500"}>
                No options available
              </div>
            )} */}
            </div>
          </div>
        </div>
      </Link>
    );
  }
};

export default Product;
