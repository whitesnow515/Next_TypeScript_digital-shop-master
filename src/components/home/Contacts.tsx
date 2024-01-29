import { EmailIcon } from "@components/ui/icon";
import { useState } from "react";
const className =
  "flex items-center gap-3 py-3 px-4 bg-black h-12 rounded-full";
const Contacts = () => {
  const [email, setEmail] = useState("");
  const handleSubscribe = () => {};
  return (
    <div className="w-full ml-[40px] mt-[40px] mb-[50px]">
      {/* <div className="bg-[#F0F0F0] flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mx-auto py-4 px-6 xl:py-9 xl:px-16 rounded-[20px] w-full">
                        <span className="text-black text-xl lg:text-3xl xl:text-[40px] leading-11 font-black max-w-[551px]">
                        STAY UPTO DATE ABOUT OUR LATEST OFFERS
                        </span>
                        <div className="flex flex-col gap-3.5 w-full lg:w-max">
                              <div className={className}>
                                    <EmailIcon />
                                    <input
                                          value={email}
                                          onChange={(e)=>setEmail(e.target.value)}
                                          placeholder="Enter your email address"
                                          className="bg-transparent border-none outline-none placeholder:text-white text-white text-base" />
                              </div>
                              <button className={`${className} text-white text-center justify-center text-base`} onClick={handleSubscribe}>
                              Subscribe to Newsletter
                              </button>
                        </div>
                  </div> */}
    </div>
  );
};

export default Contacts;
