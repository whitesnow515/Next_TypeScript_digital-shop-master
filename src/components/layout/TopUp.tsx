import React from "react";
import {
  Copy,
  Plus,
  Scan,
  Shield,
  ShieldCheck,
  ShieldPlus,
  WarningCircle,
} from "phosphor-react";
import axios from "axios";
import { useRouter } from "next/router";

const props = {
  className: "",
};

interface TopUpProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  verified_?: any;
}
function copy(text: any) {
  var input = document.createElement("input");
  input.setAttribute("value", text);
  document.body.appendChild(input);
  input.select();
  var result = document.execCommand("copy");
  document.body.removeChild(input);
  return result;
}
const fetcher = (url: string) =>
  fetch(url, {
    credentials: "include",
  }).then((res) => res.json());

export default function TopUp({
  open,
  setOpen,
  verified_,
}: TopUpProps): JSX.Element {
  const [stage, setStage] = React.useState<"qr" | "validate">("qr");
  const [submitting, setSubmitting] = React.useState<boolean>();
  const [amount, setAmount] = React.useState<number>(5);
  const router = useRouter();

  const submit = async () => {
    // try {
    setSubmitting(true);
    localStorage.setItem("topup", JSON.stringify(amount));
    setAmount(0);
    router.push("/checkout/topup");
    setOpen(false);
    //   let {
    //     data: { paymentUrl },
    //   } = await axios.post(`/api/top-up`, {
    //     amount: amount,
    //   });
    //   window.location.replace(paymentUrl);

    //   setSubmitting(false);
    //   //   setVerified(true);
    // } catch (e) {
    //   setSubmitting(false);
    // }
  };
  if (!open) return null as any;

  return (
    <div
      id="default-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="overflow-y-auto z-[10000] overflow-x-hidden fixed  bg-black bg-opacity-40 top-0 right-0 left-0 justify-center items-center w-full md:inset-0 h-full"
    >
      <div className="relative p-4 w-full md:w-[50%] lg:w-[40%] xl:w-[33%] max-h-[30%] m-auto mt-[5%] ">
        <div className="relative px-9 text-left text-white p-3 py-7 rounded-lg shadow bg-[#1F2421]">
          <div className={"flex gap-2 mb-4"}>
            <div
              className={"p-1 w-max rounded-md text-[#98C1FF] mr-3 bg-white"}
            >
              <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="42px" height="42px" viewBox="0 0 602 602"  preserveAspectRatio="xMidYMid meet">
                <g  stroke="#FFFFFF">
                  <path d="M 1.000 301.000 L 1.000 601.000 301.000 601.000 L 601.000 601.000 601.000 301.000 L 601.000 1.000 301.000 1.000 L 1.000 1.000 1.000 301.000 M 323.777 81.557 C 325.916 83.054 326.000 83.717 326.000 98.998 C 326.000 107.734 326.376 115.114 326.835 115.398 C 327.295 115.682 331.232 116.648 335.585 117.545 C 339.938 118.441 347.402 120.679 352.171 122.518 C 360.645 125.785 374.886 133.079 377.292 135.384 C 377.956 136.020 380.750 138.188 383.500 140.201 C 404.473 155.553 422.640 187.068 423.298 209.238 C 423.576 218.622 424.972 217.955 386.316 226.880 C 374.690 229.564 373.447 229.537 370.455 226.545 C 368.515 224.606 368.000 223.061 368.000 219.182 C 368.000 205.841 362.959 193.832 353.488 184.612 C 346.960 178.256 335.819 171.619 329.776 170.486 L 326.276 169.829 326.388 218.633 L 326.500 267.437 334.000 268.686 C 371.271 274.896 402.546 298.154 415.770 329.496 C 428.538 359.757 425.992 390.631 408.378 419.112 C 398.959 434.343 380.988 450.970 365.422 458.856 C 357.114 463.064 343.880 467.746 336.634 469.041 C 333.260 469.643 329.488 470.339 328.250 470.587 L 326.000 471.038 326.000 494.190 C 326.000 514.330 325.785 517.580 324.345 519.171 C 322.839 520.835 320.748 521.000 301.174 521.000 C 282.556 521.000 279.411 520.777 277.829 519.345 C 276.157 517.832 276.000 515.693 276.000 494.412 C 276.000 468.242 276.847 470.760 267.621 469.503 C 258.852 468.309 241.736 461.597 230.461 454.933 C 204.599 439.644 184.093 411.470 179.480 384.887 C 178.590 379.754 178.134 374.098 178.468 372.318 C 179.230 368.258 183.257 365.284 189.669 364.047 C 192.326 363.535 200.350 361.671 207.500 359.906 C 224.157 355.793 229.419 355.599 232.034 359.000 C 233.321 360.675 233.969 363.150 233.995 366.500 C 234.054 373.988 236.558 384.410 239.704 390.262 C 241.242 393.122 245.467 398.497 249.094 402.206 C 254.353 407.582 257.463 409.764 264.444 412.974 C 269.259 415.188 273.829 417.000 274.600 417.000 C 275.782 417.000 276.000 409.143 276.000 366.618 L 276.000 316.236 266.250 314.547 C 253.189 312.284 247.025 310.492 237.500 306.188 C 214.218 295.668 195.823 277.264 186.523 255.185 C 180.842 241.700 179.594 235.137 179.544 218.500 C 179.507 205.824 179.856 202.224 181.796 195.263 C 186.099 179.821 190.768 170.586 200.200 158.861 C 218.447 136.180 244.373 120.829 271.750 116.497 L 276.000 115.824 276.000 99.444 L 276.000 83.064 278.750 81.572 C 282.872 79.336 320.588 79.323 323.777 81.557 "/></g>
                <g >
                  <path d="M 326.580 323.753 C 325.785 324.548 325.844 399.848 326.647 409.349 C 327.110 414.832 327.680 417.000 328.659 417.000 C 329.410 417.000 333.506 415.339 337.762 413.310 C 346.763 409.018 357.857 398.658 362.189 390.500 C 366.128 383.084 368.456 370.366 367.186 363.207 C 364.702 349.200 357.785 338.687 346.154 331.239 C 340.643 327.710 327.608 322.725 326.580 323.753 "/></g>
                <g >
                  <path d="M 263.866 174.172 C 252.987 179.596 243.194 189.090 239.051 198.227 C 231.949 213.890 233.034 227.215 242.492 240.500 C 244.841 243.800 248.619 247.986 250.888 249.802 C 255.583 253.561 267.903 259.650 272.750 260.608 L 276.000 261.250 276.000 215.625 C 276.000 162.774 277.366 167.440 263.866 174.172 "/></g>
                <g fill="#FF8D93FF" stroke="#FF8D93FF">
                  <path d="M 274.975 315.658 C 275.650 315.993 276.084 333.550 276.245 367.083 L 276.490 418.000 276.495 366.833 C 276.499 326.164 276.238 315.614 275.225 315.408 C 274.524 315.266 274.411 315.379 274.975 315.658 "/></g>
                <g fill="#FF8D93FF" stroke="#FF8D93FF">
                  <path d="M 276.036 493.844 L 276.571 517.500 276.786 494.309 C 276.904 481.554 276.663 470.909 276.250 470.653 C 275.838 470.397 275.741 480.833 276.036 493.844 "/></g>
                <g fill="#FF8D93FF" stroke="#FF8D93FF">
                  <path d="M 276.236 100.000 C 276.093 109.717 275.607 116.059 275.000 116.150 C 274.450 116.233 274.563 116.345 275.250 116.400 C 276.203 116.476 276.497 112.644 276.486 100.250 L 276.471 84.000 276.236 100.000 "/></g>
              </svg>
            </div>
            <div className={"font-bold text-3xl mb-0.5"}>Top Up Balance</div>
          </div>
          <div className={"mt-1 text-[#99A29E]"}>
            Add money to your account by topping up
          </div>

          <div
            className={
              "flex border mt-3 p-2 border-[#737373] w-full rounded-md focus-within:outline-[#8F8C8C] focus-within:outline"
            }
          >
            <div className={"text-[#CACACA] ml-1 text-lg"}>$</div>
            <input
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              type={"number"}
              step={0.01}
              defaultValue={"5.00"}
              className={
                "border-none indent-[7px] w-full text-white bg-transparent focus:outline-none active:outline-none"
              }
            />
          </div>
          <div className={"flex gap-2 text-sm mt-6 mb-2"}>
            <div
              onClick={() => setOpen(false)}
              className={`font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white w-[49%] text-sm text-center rounded-full flex items-center gap-3 justify-center false px-6 py-1.5`}
            >
              Cancel
            </div>

            <div
              onClick={submit}
              className={`bg-[#FF1F40] font-bold text-sm text-center hover:bg-[#BE0924] w-[60%] text-white rounded-full  hover:cursor-pointer px-6 py-1.5`}
            >
              Submit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
