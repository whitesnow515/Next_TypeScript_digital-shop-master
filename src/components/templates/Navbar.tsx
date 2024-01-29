import React, {
  createRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Spin as Hamburger } from "hamburger-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { HiOutlineSparkles, HiShoppingCart, HiSparkles } from "react-icons/hi2";
import UserDropdown, { UserDropdownV2 } from "@components/UserDropdown";
import { AppConfig } from "@util/AppConfig";

import { Button } from "../Button";
import { Section } from "../layout/Section";
import {
  Cube,
  MagnifyingGlass,
  Package,
  Plus,
  Question,
  X,
} from "phosphor-react";
import { useCart } from "react-use-cart";
import axios from "axios";
import Cart from "@components/Cart";
import TopUp from "@components/layout/TopUp";
import Link from "next/link";
import { useRouter } from "next/router";
import { CartContext, SearchContext } from "@pages/_app";
import useSWR from "swr";
import { CircleSpinner } from "react-spinners-kit";
import { useOutsideAlerter } from "@components/hooks/useOutsideAlerter";
import { useOnClickOutside } from "usehooks-ts";
import { ArrowRightIcon, InfoIcon, SearchIcon } from "@components/ui/icon";
import Avatar from "@components/avatar/Avatar";
interface NavbarProps {
  showSupport?: boolean;
  supportLink?: string;
}

interface SearchProductProps {
  setSearch: (value: string) => null;
  searchMenu?: () => void;
  search: string;
  setOpen: (value: boolean) => void;
}

interface ProductProps {
  name: string;
  setOpen: (value: boolean) => void;
  description: string;
  bannerImage: string;
}

const Product = ({ name, setOpen, description, bannerImage }: ProductProps) => {
  const { setSearch } = useContext(SearchContext);
  return (
    <Link
      className={""}
      onClick={() => {
        setOpen(false);
        setSearch("");
      }}
      href={`/product/${encodeURIComponent(name)}`}
    >
      <div
        className={
          "no-close p-2 pt-1 text-white hover:bg-[#303633] hover:text-white hover:cursor-pointer items-center text-sm flex gap-2"
        }
      >
        <img
          className={"w-[95px] shrink-0 h-[70px] ml-2 mr-2 pt-1"}
          src={`/api/assets/img/${bannerImage}/`}
        ></img>
        <div className={"no-close"}>
          <div className={"no-close font-medium "}>{name}</div>
          <div className={"no-close text-[#9F9F9F] text-xs truncate w-[230px]"}>
            {description ? description : "No description"}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default async function fetcher(...args: any) {
  const res = await fetch(args);
  return res.json();
}
const SearchProducts = ({
  searchMenu,
  search,
  setOpen,
}: SearchProductProps) => {
  const { data: products = [], isValidating } = useSWR(
    () => (search ? `/api/products/suggestions?name=${search}` : null),
    fetcher
  );
  const ref = useRef<any>();
  // normally this works without no-close classname, but for some odd reason it doesnt

  //@ts-ignore*
  useOnClickOutside(ref, (e) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.className.includes("no-close")
    ) {
      return false;
    }
    setOpen(false);
  });
  return (
    <div ref={ref}>
      <div
        className={
          "bg-[#1F2421] w-[98%] py-2 xl:w-[95%] no-close z-10 absolute overflow-hidden overflow-y-auto max-xl:m-auto left-0 mx-auto rounded-md max-h-[400px] shadow-xl border border-[#282C37] right-0 top-[46px] sm:top-[53px]"
        }
        // maxHeight: 275px
        //         overflow-y: auto;
        //         top: 50px;
      >
        {products.length === 0 && (
          <div
            className={
              "no-close text-gray-400 text-sm p-3 flex items-center gap-3"
            }
          >
            No results found {isValidating && <CircleSpinner size={17} />}
          </div>
        )}
        {products.map((pr: any) => (
          <Product
            setOpen={setOpen}
            name={pr.name}
            description={pr.shortDescription}
            bannerImage={pr.image}
            key={"product"}
          />
        ))}
      </div>
    </div>
  );
};

const Navbar = (props: NavbarProps) => {
  const [nav, setNav] = useState(false);
  const handleClick = () => setNav(!nav);
  const session = useSession();
  const { search: search1, setSearch: setSearch1 } = useContext(SearchContext);
  const [search, setSearch] = React.useState<string>();
  const [enabled, setEnabled] = useState<string>("");
  const [mounted, setMounted] = React.useState<boolean>();
  const { menu, setMenu } = useContext(CartContext);
  const [topup, setTopup] = React.useState<boolean>();
  const [searchMenu, setSearchMenu] = React.useState<boolean>();
  const ref = createRef<any>();
  const { data } = useSWR("/api/user/balance/", fetcher);
  const balance = data ? (data.balance ? data.balance : 0) : 0;
  const router = useRouter();
  const mobileRef = useRef();
  // useOutsideAlerter(ref, () =>setMenu(false))
  useOutsideAlerter(mobileRef, () => setNav(false));

  React.useEffect(() => {
    if (search1) {
      setSearchMenu(true);
    }
  }, [search1]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnabled(localStorage.getItem("stars") ?? "true");
    }
    // remove overflow-hidden from body
    document.body.classList.remove("overflow-hidden");

    setSearch(new URLSearchParams(window.location.search).get("search") || "");

    const productSearch = document.getElementById("product-search-navbar");
    productSearch?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        window.location.href = `/products?search=${
          (productSearch as HTMLInputElement).value
        }`;
      }
    });
  }, [enabled]);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="flex flex-col w-full">
      <TopUp open={topup as boolean} setOpen={setTopup} />
      <div
        className={
          "px-5 lg:px-12 xl:px-[100px] 2xl:border-0 border-[#404242] border-b"
        }
      >
        <div className="py-5 relative items-center">
          <div className="flex max-lg:w-full m-auto items-center justify-between">
            <div className={"flex items-center gap-3 w-[60%]"}>
              <div className="shrink-0">
                <Link href="/products" className={"flex items-center gap-2"}>
                  <div className="shrink-0">
                    <Image
                      src={"/apple-touch-icon.png"}
                      className={"rounded-lg cursor-pointer"}
                      width={42}
                      height={42}
                      alt={"Logo"}
                    />
                  </div>
                  <span className="text-gray-100 hidden sm:block font-medium text-2xl cursor-pointer">
                    {" "}
                    {AppConfig.title}
                  </span>
                </Link>
              </div>
              {/* <Link href={"/"}>
                <span className="text-white font-black text-[32px]">
                  LOGO.COM
                </span>
              </Link> */}
              {router.pathname !== "/products" && (
                <div className="border-[0.5px] hidden lg:block border-[#F0F0F0] py-[7px] px-3 rounded-full ">
                  <Link
                    href="/products"
                    className="text-sm flex items-center gap-2 hover:underline hover:underline-offset-2 xl:text-base text-white font-normal"
                  >
                    <span className="whitespace-nowrap">Categories</span>
                    <ArrowRightIcon />
                  </Link>
                </div>
              )}
              <div className="bg-[#393F3C] text-white border-transparent border-2 focus-within:border-[#FF1F40] relative max-xl:hidden rounded-full flex items-center gap-3 py-3 px-4 xl:w-full">
                <SearchIcon />
                <input
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  placeholder="Search for products..."
                  className="bg-transparent text-base font-normal text-white focus:border-[#FF1F40]  placeholder:text-[#75817B] border-none outline-none w-full"
                />
                {router.pathname !== "/products" && searchMenu && (
                  <SearchProducts
                    search={search1}
                    setOpen={setSearchMenu}
                    setSearch={setSearch1}
                  />
                )}
              </div>
            </div>

            <nav className={"flex items-center"}>
              <ul className="navbar lg:relative flex md:gap-3 mr-0 ml-auto items-center font-medium text-l text-gray-100">
                {props.showSupport && props.supportLink && (
                  <li
                    className={
                      "hover:bg-[#303633] py-1 px-2 hover:rounded-full white"
                    }
                  >
                    <a
                      className="flex items-center gap-1"
                      href={`${props.supportLink}`}
                      target={"_blank"}
                    >
                      <Question size={28} />
                      <span>Help</span>
                    </a>
                  </li>
                )}

                {/* <li
                  className="cursor-pointer w-max"
                  onClick={(e) => {
                    e.preventDefault();
                    const stars =
                      localStorage.getItem("stars") === "true"
                        ? "false"
                        : "true";
                    localStorage.setItem("stars", stars);
                    setEnabled(stars);
                    window.dispatchEvent(new Event("storage"));
                  }}
                >
                  <InfoIcon />
                </li> */}
                {session.status !== "loading" && session && !session.data && (
                  <div className="lg:relative text-white cursor-pointer lg:block">
                    <div ref={ref as any}>
                      <Cart
                        setShowUserDropdown={setTopup}
                        setOpen={setMenu}
                        open={menu}
                      />
                    </div>
                  </div>
                )}

                {session.status !== "loading" ? (
                  <>
                    {!session.data && (
                      <>
                        {/* <li className="">
                          <Link className="" href="/auth/signin">
                            Sign In
                          </Link>
                        </li> */}
                        <li>
                          <Link href="/auth/signin">
                            <button className="flex items-center cursor-pointer hover:bg-[#303633] py-1 px-2 rounded-full gap-1">
                              <Avatar
                                id="dropdownHoverButton"
                                src={"/assets/images/profile.png"}
                                useMuiAvatar={true}
                              />
                              Login
                            </button>
                          </Link>
                        </li>
                      </>
                    )}

                    {session.data && (
                      <UserDropdown
                        supportLink={props.supportLink}
                        setTopUp={setTopup}
                        data={session.data}
                      />
                    )}
                  </>
                ) : null}
              </ul>
            </nav>
          </div>
          <div className="xl:hidden">
            <div className="mt-4 md:relative items-center h-[95%]">
              <div className="flex max-lg:w-full flex-col justify-between gap-6 w-full h-full md:relative mx-auto">
                <div className="bg-[#393F3C] focus-within:border-[#FF1F40] text-white border-transparent border-2 relative rounded-full flex items-center gap-3 py-3 px-4 xl:min-w-[330px]">
                  <SearchIcon />
                  <input
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    placeholder="Search for products..."
                    className="bg-transparent text-base font-normal text-white placeholder:text-white border-none outline-none w-full"
                  />
                  {router.pathname !== "/products" && searchMenu && (
                    <SearchProducts
                      search={search1}
                      setOpen={setSearchMenu}
                      setSearch={setSearch1}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute hidden 2xl:block w-full left-0 right-0 border-[#404242] border-b"></div>
      </div>
    </div>
  );
};

export { Navbar };
