import Link from "next/link";
import telegramIcon from "../../../public/assets/images/telegram.png";

const FooterNavItem = [
  {
    label: "Company",
    children: [
      {
        path: "",
        label: "About",
      },
      {
        path: "",
        label: "Features ",
      },
      {
        path: "",
        label: "Works ",
      },
      {
        path: "",
        label: "Career",
      },
    ],
  },
];
const Footer = () => {
  return (
    <div className="flex flex-col pb-10 w-full">
      <div className="flex flex-col divide-y divide-[#0000001A] mx-auto w-full">
        <div className="flex flex-col gap-5 md:flex-row md:items-center justify-between pb-9 w-full">
          <div className="flex flex-col gap-[25px]">
            <span className="text-white font-black text-[33.45px]">
              WHOISWHO
            </span>
            <span className="text-sm text-white leading-[22px] max-w-[248px]">
              We have all the stuff that suits your style and which you’re proud
              buy!
            </span>
            <div className="flex items-center gap-3 mt-2.5">
              <Link
                href={""}
                className="flex items-center justify-center gap-1.5 bg-[#F0F0F0] rounded-2xl h-[50px] w-[190px]"
              >
                <img alt="telegram" src={telegramIcon.src} />
                <span className="text-black text-xl font-normal">Telegram</span>
              </Link>
            </div>
          </div>
          {FooterNavItem.map((item, index) => (
            <div className="flex flex-col gap-[25px]" key={index}>
              <span className="text-white font-medium uppercase leading-[18px]">
                {item.label}
              </span>
              <div className="flex flex-col gap-5">
                {item.children.map((nav, i) => (
                  <Link
                    key={i}
                    href={nav.path}
                    className="text-white font-normal leading-[18px]"
                  >
                    {nav.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-5 w-full">
          <span className="text-white font-medium uppercase leading-[18px]">
            WHOISWHO © 2023, All Rights Reserved
          </span>
          <div className="flex items-center gap-3">
            {/* <VisaIcon /> */}
            <button className="bg-white text-black font-bold text-[10px] w-16 rounded-md p-2.5">
              <img className="w-11 h-3" src="assets/images/sellix.png" />
              {/* Sellix */}
            </button>
            <button className="bg-white flex font-bold gap-1 text-[#00D632]  items-center text-[10px] rounded-md p-2">
              <img
                className="w-3 h-4 shrink-0"
                src="assets/images/cashapp.png"
              />
              Cash App
            </button>
            <button className="bg-white text-violet-500 text-[11px] font-bold rounded-md p-2">
              Balance
            </button>
            {/* <BankIcon />
            <PaypalIcon /> */}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Footer;
