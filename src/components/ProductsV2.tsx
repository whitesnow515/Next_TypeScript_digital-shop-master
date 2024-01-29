import { MagnifyingGlass } from "phosphor-react";
import { FullProductInterfaceWithOption } from "@app-types/models/product";
import Product from "@components/Product";
import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import Products from "./templates/Products";
import { ArrowRightIcon, CategoryIndicator } from "./ui/icon";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const GetItem = ({
  active,
  name,
  items,
  onClick,
}: {
  active: boolean;
  name: string;
  items: any;
  onClick: () => void;
}): JSX.Element => {
  if (active) {
    return (
      <div
        className={
          "flex py-1 text-md underline-offset-[1.5px] text-[#FF1F40] underline cursor-pointer border-transparent items-center justify-between mb-1 last:mb-0"
        }
      >
        <div>{name}</div>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={
        "flex py-1 bg-transparent hover:underline hover:cursor-pointer text-md rounded-md border-transparent text-white items-center justify-between mb-1 last:mb-0"
      }
    >
      <div className={"text-white"}>{name}</div>
      <div className={"cursor-pointer"}></div>
    </div>
  );
};

export default function ProductsV2({
  categories,
  search,
  setSearch,
  featuredProducts,
}: any): JSX.Element {
  const [category, setCategory] = React.useState("all");
  const [products, setProducts] = React.useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [productIndex, setProductIndex] = useState<number>();
  const dropdownRef = React.useRef(null);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        document.getElementById("modal-id") &&
        !(document.getElementById("modal-id") as HTMLElement).contains(
          event.target as HTMLElement
        ) &&
        !(document.getElementById("dropdown-button") as HTMLElement).contains(
          event.target as HTMLElement
        )
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      className="bg-[#141716] flex flex-col gap-2 h-full py-3 px-5 lg:px-12 xl:px-[100px] w-full"
    >
      <div className={"grid grid-cols-12 max-lg:h-max w-full"}>
        <div
          className={
            "col-start-1 lg:col-end-4 col-end-13 rounded-[20px] flex flex-col gap-3 py-5 lg:min-h-[980px] h-full"
          }
        >
          <div className="flex items-center gap-1 text-base">
            <Link className="text-[#F0F0F0] font-normal cursor-pointer" href="/">
              Home
            </Link>
            <ArrowRightIcon />
            <span className="text-white">Categories</span>
          </div>
          <div className="flex items-center mt-4 justify-between w-full lg:px-0">
            <span className="text-xl text-white font-bold">Categories</span>
          </div>
          <div className={"max-lg:hidden"}>
            <GetItem
              onClick={() => setCategory("all")}
              active={category === "all"}
              name={"All Products"}
              items={products.length}
            />
            {categories.map((x: any, index: number) => (
              <GetItem
                onClick={() => {
                  setCategory(x._id);
                  setProductIndex(index);
                }}
                active={x._id === category}
                name={x.name}
                items={x.items}
              />
            ))}
          </div>
          <div className="lg:hidden px-2 lg:px-6 relative inline-block text-left">
            <button
              onClick={toggleDropdown}
              id="dropdown-button"
              type="button"
              className="bg-transparent rounded-full border w-full text-white py-2 px-4 flex outline-none ring-0 justify-between items-center"
            >
              <span>
                {(productIndex && categories[productIndex]?.name) ||
                  "All Products"}
              </span>
              <ChevronDown size={18} />
            </button>
            {isDropdownOpen && (
              <div
                id="modal-id"
                className="origin-top-right mx-2 z-30 absolute overflow-auto max-h-[30rem] right-0 border border-gray-700 left-0 mt-1 rounded-md shadow-lg bg-[#141716]"
              >
                {categories.length === 0 ? (
                  <div className="py-1">
                    <button
                      onClick={() => {}}
                      className="block px-4 py-2 text-sm outline-none ring-0 hover:text-black text-white hover:bg-gray-100"
                    >
                      No category found
                    </button>
                  </div>
                ) : (
                  <div className="">
                    <button
                      onClick={() => {
                        setCategory("all");
                        setDropdownOpen(false);
                      }}
                      className="block px-3 text-start w-full text-sm text-white hover:text-white hover:bg-[#393F3C]"
                    >
                      All Products
                    </button>
                    {categories.map((x: any, index: number) => (
                      <button
                        onClick={() => {
                          setCategory(x._id);
                          setProductIndex(index);
                          setDropdownOpen(false);
                        }}
                        className="block px-3 text-start w-full text-sm text-white hover:text-white hover:bg-[#393F3C]"
                      >
                        {x.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-6 w-full">
            <Divider style="bg-black/10" />
            {/* <Divider /> */}
          </div>
        </div>
        <div className={"col-end-13 col-start-4 max-lg:col-start-1"}>
          <div className={"py-4 pt-2 flex justify-between"}>
            <div className="flex items-center justify-between w-full">
              <span className="text-[32px] ml-2 text-white font-bold">
                {category === "all"
                  ? "All Products"
                  : categories[productIndex as number]?.name}
              </span>
              {/* <div className="flex items-center gap-3">
                <span className="text-base text-[#F0F0F0] font-normal">
                  Showing 1-10 of 100 Products
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-base text-[#F0F0F0] font-medium">
                    Sort by:
                  </span>
                  <select className="text-base text-[#F0F0F0] font-medium border-none bg-transparent">
                    <option>Most Popular</option>
                  </select>
                </div>
              </div> */}
            </div>
          </div>
          <div className={""}>
            <Products
              category={category}
              setProductCount={setProducts}
              search={search}
              setSearch={setSearch}
              featuredProductsData={featuredProducts}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
const Divider = ({ style }: { style?: string }) => {
  return (
    <div className="px-2 md:px-0 hidden lg:flex items-center w-full">
      <div
        className={`h-px block px-6 w-full ${style ?? "bg-white"} mx-auto`}
      ></div>
    </div>
  );
};
