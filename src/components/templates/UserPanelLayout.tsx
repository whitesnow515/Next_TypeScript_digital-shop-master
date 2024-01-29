import AppWrapper from "@components/AppWrapper";
import React, { useState } from "react";
import { Meta } from "./Meta";
import Link from "next/link";
import { useRouter } from "next/router";
import TopUp from "@components/layout/TopUp";

const UserPanelLayout = (props: any) => {
  const [topup, setTopup] = useState(false);
  const router = useRouter();
  let supportLink =
    typeof window !== "undefined"
      ? window.localStorage.getItem("supportLink")
      : false;
  return (
    <AppWrapper>
      <Meta title={props.title} description={props.description} />
      <TopUp open={topup as boolean} setOpen={setTopup} />
      <div className=" grid grid-cols-12 mt-6 text-gray-600 px-5 lg:px-12 xl:px-[100px] min-h-[calc(100vh-171px)]">
        <div className="text-white font-semibold hidden md:block md:col-start-1 md:col-end-3 text-[18px]">
          <div className="mt-2 flex flex-col gap-4">
              <Link
                  className={`hover:underline underline-offset-[1.5px] ${
                      router.pathname === "/profile" &&
                      !topup &&
                      "text-[#FF1F40] underline"
                  }`}
                  href="/profile"
              >
                  Profile
              </Link>
            <Link
              className={`hover:underline underline-offset-[1.5px] ${
                router.pathname === "/orders" &&
                !topup &&
                "text-[#FF1F40] underline"
              }`}
              href="/orders"
            >
              My Orders
            </Link>
            <button
              onClick={() => {
                return (window.location.href = supportLink as string);
              }}
              className="text-start hover:underline underline-offset-[1.5px]"
            >
              Support
            </button>
          </div>
        </div>
        <div className="md:col-start-3 col-start-1 col-end-13 md:col-end-13">
          {props.children}
        </div>
      </div>
    </AppWrapper>
  );
};

export default UserPanelLayout;
