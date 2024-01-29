import { IoIosArrowDown } from "react-icons/io";

import { AppConfig } from "@util/AppConfig";

import { Section } from "../layout/Section";

const Hero = () => (
  <div className="flex justify-center">
    <Section style="flex flex-wrap" yPadding="pt-20 pb-32" maxW="2xl">
      <div className="mb-[30px] text-center">
        <div className={"text-2xl text-gray-500 font-bold"}>Welcome to</div>
        <div className="text-5xl text-gray-100 font-bold whitespace-pre-line leading-hero">
            <span className="title-gradient">WHOISWHO Shop</span>
        </div>
        <div className="pb-[20px] text-xl text-gray-400">
          {AppConfig.description.toUpperCase()}
        </div>
        <div
          className="cursor-pointer hover-circle duration-300 inline-block rounded-md text-center font-extrabold text-xl py-4 px-6 text-white bg-[#141716] hover:bg-[#303633]"
          onClick={() => document.getElementById("products")?.scrollIntoView()}
        >
          Browse Products <IoIosArrowDown className="inline-block ml-2" />
        </div>
      </div>
    </Section>
  </div>
);

export { Hero };
