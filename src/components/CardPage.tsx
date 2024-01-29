import React from "react";

import { AppConfig } from "@util/AppConfig";

interface CardPageProps {
  title?: string;
  topTitle?: string;
  topTitleLink?: string;
  showTopTitle?: boolean;
  children?: React.ReactNode;
  className?:string
}

const CardPage = ({
  title,
  children,
  showTopTitle = true,
  topTitle = AppConfig.title,
  topTitleLink = "/",
  className
}: CardPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 mx-auto h-screen">
      {showTopTitle && (
        <>
          {topTitleLink !== "" ? (
            <a
              href={"/"}
              className="flex items-center mb-6 text-2xl font-semibold text-white"
            >
              {/* {topTitle} */}
            </a>
          ) : (
            <span className="flex items-center mb-6 text-2xl font-semibold text-white">
              {/* {topTitle} */}
            </span>
          )}
        </>
      )}
      <div className={`w-full shadow shadow-black ${className??"sm:max-w-md"} rounded-[20px] bg-[#1F2421] border border-[#303633] md:mt-0  xl:p-0`}>
        <div className="p-6 space-y-4 md:space-y-6 sm:p-6">
          {title && (
            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl lg:text-4xl text-white text-center">
              {title}
            </h1>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardPage;
