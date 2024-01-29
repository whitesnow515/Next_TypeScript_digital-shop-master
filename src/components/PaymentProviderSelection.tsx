//@ts-nocheck
import React, { memo } from "react";

import axios from "axios";
import Big from "big.js";
import Image from "next/image";
import Swal from "sweetalert2";

import {
  FullProductInterfaceWithOption,
  ProductInterface,
} from "@app-types/models/product";
import { FrontendPaymentProvider } from "@app-types/payment/providers";
import { calculateFee } from "@util/common/fee";
import { getPriceStr } from "@util/EasterEgg";
import { error } from "@util/log";
import {useSession} from "next-auth/react";

interface PaymentProviderSelectionProps {
  provider: FrontendPaymentProvider | 'sellix';
  disabled?: boolean;
  product: ProductInterface;
  selectedOption: FullProductInterfaceWithOption | null;
  quantity: number;
  hideModal?: () => void;
  emailRef?: React.RefObject<HTMLInputElement> | null;
  session?: any;
  allowGuestCheckout?: boolean;
  total?: number; // our total calculated with Big.js to avoid floating point errors
  fee?: number; // fee, 100 = 0%, 110 = 10%, 90 = -10%
}

const PaymentProviderSelection = (props: PaymentProviderSelectionProps) => {
  const [loading, setLoading] = React.useState(false);
  // check if price >= minPrice, if no, return null
  const [disabled, setDisabled] = React.useState(false);
  const session = useSession();

  React.useEffect(() => {
    setDisabled(
      !!(
        props.provider.minPrice &&
        props.total &&
        props.total < props.provider.minPrice
      )
    );
  }, [props.provider.minPrice, props.total]);
  const FeeDisplay = memo(function FeeDisplay() {
    if (props.fee && props.fee > 0 && props.fee !== 100) {
      const fee = calculateFee(props.fee); // fee percentage
      // const price = props.total ? props.total * (props.fee / 100) : -1; // fee price
      const price = props.total
        ? Big(props.total).times(props.fee).div(100)
        : Big(-1); // fee price
      return (
        <span className="text-sm text-gray-400">
          {fee}
          {"% "}
          fee {price.gt(-1) ? `(${getPriceStr(price.toFixed(2))})` : ""}
        </span>
      );
    }
    return null;
  });
  return (
    <>
      {disabled && (
        <div>
          <div
            id={`${props.provider.name}-min-price-tooltip`}
            role="tooltip"
            className="absolute z-10 invisible inline-block w-64 text-sm font-light transition-opacity duration-300 border rounded-lg shadow-sm opacity-0 text-gray-400 border-gray-600 bg-gray-800"
            style={{
              bottom: "70px",
            }}
          >
            <div className="px-3 py-2 border-b rounded-t-lg border-[#404242] bg-[#141716]">
              <h3 className="font-semibold text-white">Minimum Price</h3>
            </div>
            <div className="px-3 py-2">
              <span>
                Minimum order total of ${props.provider.minPrice} to use{" "}
                {props.provider.name}
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className={`flex items-center p-3 text-base font-bold rounded-lg group ${
          disabled
            ? "cursor-not-allowed bg-[#141716] text-gray-500"
            : "cursor-pointer hover:shadow hover:bg-gray-500 bg-[#303633] text-white"
        } hover-circle`}
        onMouseEnter={() => {
          const popover = document.getElementById(
            `${props.provider.name}-min-price-tooltip`
          );
          if (popover) {
            popover.classList.remove("opacity-0", "invisible");
            popover.classList.add("opacity-100", "visible");
          }
        }}
        onMouseLeave={() => {
          const popover = document.getElementById(
            `${props.provider.name}-min-price-tooltip`
          );
          if (popover) {
            popover.classList.remove("opacity-10", "visible");
            popover.classList.add("opacity-0", "invisible");
          }
        }}
        onClick={() => {
          if (loading || disabled) {
            return;
          }
          setLoading(true);
          const data: any = {
            productId: props.product._id,
            optionId: props.selectedOption?._id,
            quantity: props.quantity,
            paymentMethod: props.provider.name,
          };
          if (window.captchaToken) {
            data["cf-turnstile-response"] = window.captchaToken;
          }
          if (
              session &&
              session.status === "unauthenticated" &&
              props.allowGuestCheckout &&
              props.emailRef?.current
          ) {
            data.email = (props.emailRef?.current as HTMLInputElement).value;
          }
          axios
            .post(`/api/checkout/`, data)
            .then((res) => {
              if (res.data.success) {
                window.location.href = res.data.paymentUrl;
              } else {
                Swal.fire({
                  title: "Error",
                  text: res.data.message,
                  icon: "error",
                });
              }
            })
            .catch((err) => {
              error(err);
              Swal.fire({
                title: "Error",
                text: err.response?.data?.message || err.message,
                icon: "error",
              });
            })
            .finally(() => {
              setLoading(false);
              if (props.hideModal) props.hideModal();
            });
        }}
      >
        {props.provider.url && (
          <Image
            src={props.provider.url}
            width={props.provider.imgWidth}
            height={props.provider.imgHeight}
            alt={props.provider.name}
            className={`cursor-pointer hover-circle ${
              props.provider?.roundedCorners ? "rounded-lg" : ""
            } ${disabled ? "opacity-50" : ""}`}
          />
        )}
        <span className={"flex-1 ml-3 whitespace-nowrap hover-circle"}>
          {props.provider.label}
        </span>
        <FeeDisplay />
        {loading && (
          <svg
            aria-hidden="true"
            role="status"
            className="inline w-4 h-4 mr-3 text-white animate-spin"
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
        )}
      </div>
    </>
  );
};

export default PaymentProviderSelection;
