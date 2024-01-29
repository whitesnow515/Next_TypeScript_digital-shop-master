import {
  ArrowRightIcon,
  CartIcon,
  CirclePlusIcon,
  SearchIcon,
  UserIcon,
} from "@components/ui/icon";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const [search, setSearch] = useState("");
  return (
    <div className="flex flex-col bg-[#141716] pt-[67px] pb-8 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <span className="text-white font-black text-[32px]">LOGO.COM</span>
          <div className="border-[0.5px] border-[#F0F0F0] py-[7px] px-3 rounded-full flex items-center gap-2">
            <Link href="/products" className="text-base text-white font-normal">
              Categories
            </Link>
            <ArrowRightIcon />
          </div>
          <div className="bg-[#F0F0F0] rounded-full flex items-center gap-3 py-3 px-4 min-w-[467px]">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className=" bg-transparent text-base font-normal text-[#181818] placeholder:text-[#181818] border-none outline-none w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href={"/"} className="flex items-center justify-center">
              <InfoIcon color="white" />
            </Link>
            <Link href={"/"} className="flex items-center justify-center">
              <CartIcon />
            </Link>
            <Link
              href={"/"}
              className="flex hover:scale-110 transition delay-150 duration-300 ease-in-out items-center justify-center"
            >
              <UserIcon />
            </Link>
          </div>
          <div className="border-[0.5px] bg-black border-black h-9 rounded-full w-[144px] flex items-center justify-between py-2 px-3 relative">
            <span className="text-base text-white font-normal">$3.00</span>
            <button className="outline-none border-none bg-white border-[0.5px] border-[#F0F0F0] p-1.5 rounded-full absolute right-0">
              <CirclePlusIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
