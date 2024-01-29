import React, { useContext, useRef, useState } from "react";

import Avatar from "@components/avatar/Avatar";
import { isStaff } from "@util/ClientUtils";
import Link from "next/link";
import useSWR from "swr";
import { Plus } from "phosphor-react";
import Cart from "@components/Cart";
import { useOutsideAlerter } from "@components/hooks/useOutsideAlerter";
import { CartContext } from "@pages/_app";
import { useRouter } from "next/router";
import { HiOutlineSparkles, HiSparkles } from "react-icons/hi2";
import { Cache } from "three";
import enabled = Cache.enabled;
import Image from "next/image";
import { Button } from "../components/Button";
import { CirclePlusIcon } from "./ui/icon";

interface UserDropdownProps {
  data: any;
  useDivAsBaseElement?: boolean;
  supportLink?: string;
  hideCart?: boolean;
  setTopUp: (value: boolean) => void;
  setEnabled?: (value: string) => void;
  enabled?: string;
}

const fetcher = (url: string) =>
  fetch(url, {
    credentials: "include",
  }).then((res) => res.json());

export function UserDropdownV2(props: UserDropdownProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { data } = useSWR("/api/user/balance/", fetcher);
  const balance = data ? (data.balance ? data.balance : 0) : 0;
  const { menu, setMenu } = useContext(CartContext);
  const ref = useRef();
  useOutsideAlerter(ref, () => setMenu(false));

  function getDropdownDisplayText(text: string) {
    return (
      <span className="block px-4 py-2 hover:bg-[#303633] hover:text-white duration-300 text-center hover-circle hover:cursor-pointer">
        {text}
      </span>
    );
  }

  function getImageUrl(): string {
    const img1 = props.data?.image as string;
    const img2 = props.data?.data?.image as string;
    if (img1) {
      return img1;
    }
    if (img2) {
      return img2;
    }
    return "/assets/images/profile.png";
  }

  function getActualComponent() {
    const router = useRouter();
    return (
      <>
        <div className={"flex items-center gap-4"}>
          <Avatar
            id="dropdownHoverButton"
            src={getImageUrl()}
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
            }}
            useMuiAvatar={true}
            className={"mr-3"}
          />
        </div>
        {showUserDropdown && ( // We are rendering it like this because the dropdown briefly shows on the screen when loaded.
          <div
            id={"dropdownHover"}
            className={`absolute right-0 top-[90px] z-[10000] divide-y divide-gray-100 rounded-lg shadow w-44 bg-[#141716] duration-300`}
          >
            <ul
              className="py-2 text-sm text-gray-200 "
              aria-labelledby="dropdownDefaultButton"
            >
              <li>
                <Link href="/profile">{getDropdownDisplayText("Profile")}</Link>
              </li>
              <li>
                <Link href="/orders">
                  {getDropdownDisplayText("My Orders")}
                </Link>
              </li>
              {isStaff(props.data) && (
                <li>
                  <Link href="/admin">{getDropdownDisplayText("Admin")}</Link>
                </li>
              )}
              {/* @ts-ignore */}
              {
                // are we on admin page?
                router.pathname === "/admin" && (
                  <li>
                    <Link href="/">
                      {getDropdownDisplayText("Back to Store")}
                    </Link>
                  </li>
                )
              }
              <li>
                <a href="/auth/signout">{getDropdownDisplayText("Sign Out")}</a>
              </li>
            </ul>
          </div>
        )}
      </>
    );
  }
  if (props.useDivAsBaseElement) {
    return <div className="group">{getActualComponent()}</div>;
  }
  return <>{getActualComponent()}</>;
}

function UserDropdown(props: UserDropdownProps) {
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState(false);
  const { data } = useSWR("/api/user/balance/", fetcher);
  const balance = data ? (data.balance ? data.balance : 0) : 0;
  const { menu, setMenu } = useContext(CartContext);
  const ref = useRef();
  const router = useRouter();
  useOutsideAlerter(ref, () => setMenu(false));
  function getDropdownDisplayText(text: string) {
    return (
      <span className="block py-2 px-4 pl-3 mt-1 hover:bg-[#303633] rounded-full text-start duration-300 hover-circle hover:cursor-pointer">
        {text}
      </span>
    );
  }

  function getImageUrl(): string {
    const img1 = props.data?.image as string;
    const img2 = props.data?.data?.image as string;
    if (img1) {
      return img1;
    }
    if (img2) {
      return img2;
    }
    return "/assets/images/profile.png";
  }

  const formatBalance = (balance: number) => {
    if (balance >= 1000000000) {
      // Display in billions
      return (balance / 1000000000).toFixed(2) + "B";
    } else if (balance >= 1000000) {
      // Display in millions
      return (balance / 1000000).toFixed(2) + "M";
    } else if (balance >= 1000) {
      // Display in thousands
      return (balance / 1000).toFixed(2) + "K";
    } else {
      // Display as is
      return balance.toFixed(2);
    }
  };
  function getActualComponent() {
    const { pathname } = useRouter();
    return (
      <div className={""}>
        <div className={"flex items-center gap-2"}>
          {!props.hideCart && props.data && (
            <div className="text-white cursor-pointer">
              <div>
                <Cart
                  setShowUserDropdown={setShowUserDropdown as () => void}
                  setOpen={setMenu}
                  open={menu}
                />
              </div>
            </div>
          )}

          <div className={""}>
            {!props.data ? (
              <Link href="/auth/signin">
                <Avatar
                  id="dropdownHoverButton"
                  src={getImageUrl()}
                  useMuiAvatar={true}
                />
              </Link>
            ) : (
              <div
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setMenu(false);
                }}
                className="flex items-center cursor-pointer hover:bg-[#303633] py-1 px-2 rounded-full gap-1"
              >
                <Avatar
                  id="dropdownHoverButton"
                  src={getImageUrl()}
                  useMuiAvatar={true}
                />
                <span className="hidden md:block">
                  {props.data.name &&
                    props.data.name.charAt(0).toUpperCase() +
                      props.data.name.slice(1)}
                </span>
              </div>
            )}

            {showUserDropdown && (
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="backdrop"
              ></div>
            )}
            {/* // We are rendering it like this because the dropdown briefly shows on the screen when loaded. */}
            <>
              {showUserDropdown && (
                <div
                  className="backdrop block md:hidden"
                  onClick={() => setShowUserDropdown(false)}
                ></div>
              )}
              <div
                id={"dropdownHover"}
                className={`fixed md:absolute right-0 left-0 md:left-auto md:right-[10%] md:w-[300px] bottom-0 md:bottom-auto md:top-[70px] lg:top-[50px] z-20 divide-y divide-gray-100 rounded-xl pt-5 px-5 md:py-0 shadow bg-[#1F2421] md:bg-[#1F2421] custom-dropdown ${
                  showUserDropdown ? "active block" : "md:hidden"
                }`}
              >
                <div className="px-1 py-3 mb-2 border-b-2 border-[#404242] mx-auto w-full">
                  <button className="flex my-2 px-4 rounded-2xl text-white py-3 items-center justify-between hover:bg-[#303633] w-full" onClick={() => {
                            props.setTopUp(true);
                            setShowUserDropdown(false);
                          }}>
                    <div className="flex items-center gap-3">
                      <div className={"bg-white border border-white"}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="29px" height="29px" viewBox="0 0 602 602"  preserveAspectRatio="xMidYMid meet">
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
                      <p className="text-xl sm:text-sm md:text-xs text-[#99a29e]">
                        ACCOUNT BALANCE
                      </p>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <div className="text-xl sm:text-lg flex items-center md:text-sm">
                        <div>
                          <p className="text-xl sm:text-sm md:text-xs text-[#99a29e]">
                            ${formatBalance(balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                {/* <div className="border-t border-[#2A2F2B] mx-auto my-2 w-[95%]"></div> */}
                <ul
                  className="border-none bg-[#1F2421] rounded-lg ml-2 mr-2 py-2 text-xl sm:text-sm text-white"
                  aria-labelledby="dropdownDefaultButton"
                >
                  <li>
                    <Link href="/profile">
                      {getDropdownDisplayText("Profile")}
                    </Link>
                  </li>
                  {isStaff(props.data) && (
                      <li>
                        <button
                            className="w-full"
                            onClick={() => {
                              props.setTopUp(true);
                              setShowUserDropdown(false);
                            }}
                        >
                          {getDropdownDisplayText("Topup")}
                        </button>
                      </li>
                  )}
                  <li>
                    <Link href="/orders">
                      {getDropdownDisplayText("My Orders")}
                    </Link>
                  </li>
                  <li>
                    <Link href={`${props.supportLink}`}>
                      {getDropdownDisplayText("Support")}
                    </Link>
                  </li>
                  {isStaff(props.data) && (
                    <li>
                      <Link href="/admin">
                        {getDropdownDisplayText("Admin")}
                      </Link>
                    </li>
                  )}
                  {
                    // are we on admin page?
                    router.pathname === "/admin" && (
                      <li>
                        <Link href="/">
                          {getDropdownDisplayText("Back to Store")}
                        </Link>
                      </li>
                    )
                  }
                  <div className="border-b-2 mt-3 mb-4 border-[#404242] mx-auto w-full"></div>
                  <li className={"mb-3"}>
                    <Link href="/auth/signout">
                      {getDropdownDisplayText("Sign Out")}
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          </div>
          {props.data && (
            <>
              {!pathname.startsWith("/admin") && (
                <>
                  <div className="border-[0.5px] bg-black border-black hidden md:flex h-[34px] rounded-full w-[144px] flex items-center justify-between py-2 px-3 relative ml-2.5">
                    <span className="text-base text-white font-normal">
                      ${formatBalance(balance)}{" "}
                    </span>
                    <button
                      onClick={() => props.setTopUp(true)}
                      className="outline-none hover:scale-105 transition delay-150 duration-300 ease-in-out border-none bg-white border-[0.5px] border-[#F0F0F0] flex items-center p-[5px] justify-center rounded-full absolute right-0"
                    >
                      <CirclePlusIcon />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (props.useDivAsBaseElement) {
    return <div className="group">{getActualComponent()}</div>;
  }
  return (
    <>
      <li className="group">{getActualComponent()}</li>
    </>
  );
}

export default UserDropdown;
