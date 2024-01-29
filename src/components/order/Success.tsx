import CrispComponent from "@components/CrispComponent";
import "./Success.css";
import Link from "next/link";
import React from "react";

const Success = ({ orderId }: any) => {
  const containerStyle = {
    fontFamily: "Times New Roman",
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    margin: 0,
    padding: "32px 0 0",
    position: "relative",
    textAlign: "left",
    zIndex: 1,
    color: "#F0F2F5",
  };

  const innerContainerStyle = {
    alignSelf: "center",
    paddingTop: "57px",
    position: "relative",
    textAlign: "left",
    color: "#F0F2F5",
  };

  const spanStyle = {
    animation: "b-FfS6d6 1.5s both",
    backgroundColor: "#59D990",
    borderRadius: "50%",
    height: "4px",
    left: "-3px",
    position: "absolute",
    top: "0",
    width: "4px",
    color: "#F0F2F5",
  };

  return (
    <div className="h-[100%]">
      <>
        <div
          title={""}
          className="max-w-[718px] h-[100%] mx-auto flex flex-col items-center justify-center hover:border-white"
        >
          <CrispComponent />

          <div className="flex flex-col items-center justify-center max-w-[510px] mx-auto w-full mb-[70px]">
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      points="41 20 23.813 37.188 16 29.375"
                    ></polyline>
                  </g>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl text-white font-bold mt-4">
              Order completed
            </h1>
            <span className="text-center mt-[9px] text-[#99A29E]">
              You can see your products under the Orders page. You will also
              receive an email with your order details. Thank you for your
              purchase!
            </span>
            <div className="flex items-center w-[75%] justify-center gap-2 mt-6">
              {/* <Link
                href={`/orders/${orderId}`}
                className="flex rounded-full items-center text-white justify-center text-center bg-[#FF1F40] hover:bg-[#BE0924] font-bold py-3 w-full text-base lg:text-sm"
              >
                View Status
              </Link> */}
              <Link
                href="/products"
                className="flex rounded-full items-center text-white justify-center text-center bg-[#FF1F40] hover:bg-[#BE0924] font-bold py-3 w-[50%] text-base lg:text-sm"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default Success;