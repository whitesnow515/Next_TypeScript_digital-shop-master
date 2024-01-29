import React, { useEffect, useRef } from "react";
import { WarningCircle } from "phosphor-react";
import "./Enable2FA.css";
import useSWR from "swr";
import axios from "axios";
import { useRouter } from "next/router";

const props = {
  className: "",
};

interface Enable2FAProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  verified_?: any;
}

function copy(text: string) {
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

export default function Enable2FA({
  open,
  setOpen,
  verified_,
  verified,
  setVerified,
  setStage,
  stage,
}: Enable2FAProps | any): JSX.Element {
  const { data } = useSWR("/api/user/2fa", fetcher);
  const [code, setCode] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>();
  const [invalid, setInvalid] = React.useState<boolean>();
  const router = useRouter();
  const [isCopy, setIsCopy] = React.useState(false);
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const handleCopyClick = () => {
    if (codeRef.current) {
      codeRef.current.select();
      document.execCommand("copy");
      setIsCopy(true);
      (window.getSelection() as any).removeAllRanges();
    }
  };
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setIsCopy(false);
    }, 500);

    return () => {
      clearInterval(timerInterval);
    };
  }, [isCopy]);
  const submit = async () => {
    try {
      setSubmitting(true);
      await axios.post(`/api/user/2fa/`, {
        code,
      });
      router.replace(router.asPath);
      setSubmitting(false);
      setInvalid(false);
      setVerified(true);
    } catch (e) {
      setInvalid(true);
      setSubmitting(false);
    }
  };

  /* @ts-ignore */
  if (!open) return;
  if (verified || verified_) {
    return (
      <div
        id="default-modal"
        tabIndex={-1}
        aria-hidden="true"
        className="overflow-y-auto overflow-x-hidden fixed  bg-black bg-opacity-40 top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full"
      >
        <div className="relative px-10 px-5 md:w-[50%] xl:w-[35%] m-auto mt-[14%] lg:mt-[5%] lg:h-[20%]">
          <div className="relative  text-center text-white p-3 py-5 rounded-lg shadow bg-[#1F2421]">
            <div className="custom-container">
              <div className="inner-container">
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <span className="custom-span"></span>
                <svg
                  className="custom-svg"
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                >
                  <g fill="none" fillRule="evenodd">
                    <path
                      fill="#12CE66"
                      d="M28,56 C43.463973,56 56,43.463973 56,28 C56,12.536027 43.463973,0 28,0 C12.536027,0 0,12.536027 0,28 C0,43.463973 12.536027,56 28,56 Z"
                      className=""
                    ></path>
                    <polyline
                      stroke="#FFF"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3.5"
                      points="41 20 23.813 37.188 16 29.375"
                    ></polyline>
                  </g>
                </svg>
              </div>
            </div>
            <div className={"font-semibold text-lg mt-6 mb-0.5"}>
              Two-factor authentication enabled
            </div>
            <div className={"mt-1 m-auto mt-3 text-center"}>
              Congratulations, 2FA authentication is now enabled on your
              account!
            </div>
            <div className={"flex  gap-4 justify-center text-sm mt-6 mb-2"}>
              <div
                onClick={() => setOpen(false)}
                className={`font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white w-[49%] text-sm text-center rounded-full flex items-center gap-3 justify-center false px-6 py-1.5 ${
                  submitting && "opacity-60 pointer-events-none"
                }`}
              >
                Close
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "validate") {
    return (
      <div
        id="default-modal"
        tabIndex={-1}
        aria-hidden="true"
        className="overflow-y-auto overflow-x-hidden fixed  bg-black bg-opacity-40 top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full"
      >
        <div className="relative px-10 md:w-[50%] xl:w-[35%] m-auto mt-[14%] lg:mt-[5%] lg:h-[20%]">
          <div className="relative  text-center text-white p-3 py-5 rounded-lg shadow bg-[#1F2421]">
            <div className={"mt-1"}>
              To setup two-factor authentication, enter your generated code
            </div>
            <div
              className={"flex flex-col my-6 justify-center items-center gap-3"}
            >
              {invalid && (
                <div className={"text-[#FF3838] flex items-center -mt-4 gap-3"}>
                  <WarningCircle size={20} />
                  Invalid code
                </div>
              )}
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder={"000000"}
                className={
                  "outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
                }
              />
            </div>
            <div className={"flex gap-4 justify-center text-sm mt-6"}>
              <div
                onClick={() => {
                  setStage("");
                  setOpen(false);
                }}
                className={`font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white w-[49%] text-sm text-center rounded-full flex items-center gap-3 justify-center false px-6 py-1.5 ${
                  submitting && "opacity-60 pointer-events-none"
                }`}
              >
                Cancel
              </div>

              <button
                onClick={submit}
                disabled={code.length < 6}
                className={`bg-[#FF1F40] disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm text-center hover:bg-[#BE0924] w-[60%] text-white rounded-full  hover:cursor-pointer px-6 py-1.5 ${
                  submitting && "opacity-60 pointer-events-none"
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      id="default-modal"
      tabIndex={-1}
      aria-hidden="true"
      className="overflow-y-auto overflow-x-hidden fixed  bg-black bg-opacity-40 top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full"
    >
      <div className="relative px-10 px-5 md:w-[50%] xl:w-[35%] m-auto mt-[14%] lg:mt-[5%] lg:h-[20%]">
        <div className="relative  text-center text-white p-3 py-5 rounded-lg shadow bg-[#1F2421]">
          <div className={"mt-1"}>Open authenticator and scan this QR code</div>
          <img src={data.url} className={"m-auto my-6"} />
          <div className={"flex items-center gap-3 mt-4 w-[90%] m-auto mt-3"}>
            <div className={"h-[1px] flex-1 bg-[#464646]"} />
            <div className={"text-[#A7A7A7]"}>OR enter the code manually</div>
            <div className={"h-[1px] flex-1 b bg-[#464646]"} />
          </div>
          {/*<div className={"flex justify-center items-center gap-3 mt-3"}>*/}
          {/*  <input*/}
          {/*    readOnly={true}*/}
          {/*    value={data.code}*/}
          {/*    className={*/}
          {/*      "border  indent-[12px] bg-transparent border-[#737373] text-white rounded-md h-[40px]"*/}
          {/*    }*/}
          {/*  />*/}
          {/*  <div*/}
          {/*    className={*/}
          {/*      "h-[40px] focus:outline-none  active:outline-none w-[40px] flex justify-center items-center  border-[#737373] border rounded-md"*/}
          {/*    }*/}
          {/*    onClick={() => {*/}
          {/*      copy(data.code);*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    <Copy size={25} />*/}
          {/*  </div>*/}
          {/*</div>*/}
          <div className="flex flex-col justify-start gap-5 mt-3 px-8 ">
            <div className={"mt-2"}>
              <button
                onClick={handleCopyClick}
                className="bg-[#393F3C] font-bold hover:bg-[#4A524E] w-full px-6 py-1 flex items-center justify-center gap-1 rounded-full"
              >
                {!isCopy ? (
                  <>
                    Copy SecretKey
                    <img className="w-5 h-5" src="/assets/images/copy.svg" />
                  </>
                ) : (
                  <>Copied</>
                )}
              </button>
            </div>
            <div className="w-full">
              {/*<h1 className="font-bold">*/}
              {/*  {paymentinfo.paymentMethod === "cashapp" ? (*/}
              {/*      <>*/}
              {/*        {"CashApp note ("}*/}
              {/*        <span className="text-[#99A29E]">include in note</span>*/}
              {/*        {")"}*/}
              {/*      </>*/}
              {/*  ) : (*/}
              {/*      "Payment Unique Address"*/}
              {/*  )}*/}
              {/*</h1>*/}
              {/* <p ref={addressRef}>{paymentinfo?.address}</p> */}
              <textarea
                className="bg-transparent outline-none ring-0 w-full"
                ref={codeRef as any}
                value={data.code}
                onClick={handleCopyClick}
                readOnly
              />
            </div>
          </div>
          <div className={"flex gap-4 px-5 text-sm justify-center mt-6"}>
            <div
              onClick={() => setOpen(false)}
              className={`font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white w-[49%] text-sm text-center rounded-full flex items-center gap-3 justify-center false px-6 py-1.5 ${
                submitting && "opacity-60 pointer-events-none"
              }`}
            >
              Cancel
            </div>

            <div
              onClick={() => setStage("validate")}
              className={`bg-[#FF1F40] font-bold text-sm text-center hover:bg-[#BE0924] w-[49%] text-white rounded-full  hover:cursor-pointer px-6 py-1.5  ${
                submitting && "opacity-60 pointer-events-none"
              }`}
            >
              Verify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
