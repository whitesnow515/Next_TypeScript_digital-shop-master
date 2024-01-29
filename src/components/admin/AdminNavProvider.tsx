"use client";

import React, { useEffect, useState } from "react";

import {
  FaBox,
  FaChartLine,
  FaCheck,
  FaCog,
  FaEnvelope,
  FaFlag,
  FaMoneyBill,
  FaReceipt,
  FaShoppingCart,
  FaUsers,
} from "react-icons/fa";
// import { HiOutlineSparkles, HiSparkles } from "react-icons/hi2";

import RequireRole from "@components/auth/RequireRole";
import { Meta } from "@components/templates/Meta";
import UserDropdown from "@components/UserDropdown";
import { AppConfig } from "@util/AppConfig";
import { log } from "@util/log";
import Link from "next/link";
import NextTransitionBar from "next-transition-bar";
import { useSession } from "next-auth/react";

interface AdminNavProviderProps {
  children: React.ReactNode;
  session: any;
}

const AdminNavProvider = (props: AdminNavProviderProps) => {
  const session: any = useSession();
  const [topup, setTopup] = React.useState<boolean>();

  const roles = session.data ? session.data.roles : [];


  const [enabled, setEnabled] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnabled(localStorage.getItem("stars") ?? "true");
    }
  }, [enabled]);
  return (
    <>
      <Meta title={`Admin`} description={`${AppConfig.title} Admin Panel`} />
      <NextTransitionBar
        color="#29d"
        initialPosition={0.08}
        trickleSpeed={200}
        height={4}
        trickle={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #29d, 0 0 5px #29d"
        template='<div class="bar" role="bar"><div class="peg"></div></div>
            <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
        zIndex={1600}
        showAtBottom={false}
        isRTL={false}
        nonce={undefined}
        transformCSS={(css) => <style nonce={undefined}>{css}</style>}
      />
      <nav className="fixed top-0 z-50 w-full border-b border-[#404242] bg-gray-800">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                data-drawer-target="logo-sidebar"
                data-drawer-toggle="logo-sidebar"
                onClick={() => {
                  log("clicked");
                  const sidebar = document.getElementById("logo-sidebar");
                  if (sidebar) {
                    if (sidebar.classList.contains("sidebar-open")) {
                      sidebar.classList.remove("sidebar-open");
                      sidebar.classList.add("translate-x-0"); // hide
                      sidebar.classList.add("sm:translate-x-0");
                      return;
                    }
                    const hasNormalTranslate =
                      sidebar.classList.contains("translate-x-0");
                    const hasSmTranslate =
                      sidebar.classList.contains("sm:translate-x-0");
                    if (hasNormalTranslate || hasSmTranslate) {
                      sidebar.classList.remove("translate-x-0");
                      sidebar.classList.remove("sm:translate-x-0");
                      sidebar.classList.add("sidebar-open");
                    }
                    /*
                    const a = sidebar.classList.toggle("translate-x-0");
                    const b = sidebar.classList.toggle("sm:translate-x-0");
                    log({ a, b });
                     */
                  }
                }}
                aria-controls="logo-sidebar"
                type="button"
                className="inline-flex items-center p-2 text-sm rounded-lg md:hidden focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-400 hover:bg-[#303633] focus:ring-gray-600"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <a href="/" className="flex ml-2 md:mr-24">
                {/*
                <img
                  src="https://flowbite.com/docs/images/logo.svg"
                  className="h-8 mr-3"
                  alt="FlowBite Logo"
                />
                */}
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white hover-circle">
                  {AppConfig.title}
                </span>
                <span className="self-center text-xs font-semibold sm:text-xs whitespace-nowrap text-white pl-4 hover-circle">
                  (Admin)
                </span>
              </a>
            </div>
            <UserDropdown
              setTopUp={setTopup}
              hideCart={true}
              data={props.session}
              useDivAsBaseElement={true}
            />
          </div>
        </div>
      </nav>

      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen pt-13 transition-transform -translate-x-full  border-r border-[#414352]  sm:translate-x-0 bg-gray-800 sidebar-open"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 mt-2.5 pt-16 overflow-y-auto bg-[#141716]">
          <ul className="space-y-2">
            {roles.includes("admin") || roles.includes("super_admin") ? (
              <li>
                <Link
                  href="/admin/"
                  className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
                >
                  <FaChartLine
                    className={
                      "w-6 h-6  text-white "
                    }
                  />
                  <span className="ml-3 hover-circle">Dashboard</span>
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/admin/users/list"
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaUsers
                  className={
                    "w-6 h-6  text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Users
                </span>
              </Link>
            </li>
            <RequireRole admin>
              <li>
                <Link
                  href="/admin/products"
                  className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
                >
                  <FaShoppingCart
                    className={
                      "w-6 h-6 text-white"
                    }
                  />
                  <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                    Products
                  </span>
                </Link>
              </li>
            </RequireRole>
            <RequireRole admin>
              <li>
                <Link
                  href="/admin/products/categories"
                  className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
                >
                  <FaBox
                    className={
                      "w-6 h-6 text-white"
                    }
                  />
                  <span className="flex-1 ml-3 text-white">
                    Categories
                  </span>
                </Link>
              </li>
            </RequireRole>
            <li>
              <Link
                href={"/admin/orders/list"}
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaReceipt
                  className={
                    "w-6 h-6 text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Orders
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={"/admin/top-ups"}
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaMoneyBill
                  className={
                    "w-6 h-6 text-white group-hover:text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Top Ups
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={"/admin/flagged"}
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaFlag
                  className={
                    "w-6 h-6  text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Flagged Emails
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={"/admin/queue/list"}
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaCheck
                  className={
                    "w-6 h-6  text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Verification Queue
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={"/admin/allowed-emails"}
                className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
              >
                <FaEnvelope
                  className={
                    "w-6 h-6  text-white"
                  }
                />
                <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                  Allowed Emails
                </span>
              </Link>
            </li>
            <RequireRole admin>
              <li>
                <Link
                  href={"/admin/settings"}
                  className="flex items-center p-2 text-base font-normal rounded-lg text-white hover:bg-[#303633]"
                >
                  <FaCog
                    className={
                      "w-6 h-6  text-white"
                    }
                  />
                  <span className="flex-1 ml-3 whitespace-nowrap hover-circle">
                    Settings
                  </span>
                </Link>
              </li>
            </RequireRole>
          </ul>
        </div>
      </aside>

      <div className="p-8 mt-14 sm:ml-64 text-white">{props.children}</div>
    </>
  );
};

export default AdminNavProvider;
