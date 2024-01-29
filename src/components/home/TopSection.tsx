import Link from "next/link";
import HomeProduct from "../../../public/assets/images/home-product.png";
const TopSection = () => {
  return (
    <div className="flex w-full lg:min-h-[663px] py-10 bg-transparent">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full px-5 lg:px-[100px] mx-auto">
        <div className="flex flex-col gap-5 lg:gap-8 w-full lg:w-1/2">
          <span className="text-white text-center lg:text-start text-4xl md:text-5xl xl:text-[64px] font-black xl:leading-[64px]">
            FIND STUFF THAT MATCHES YOUR STYLE
          </span>
          <span className="text-base text-center lg:text-start text-white leading-[22px] font-normal">
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </span>
          <Link
            href="/products"
            className="flex items-center justify-center max-w-max py-4 px-[54px] rounded-full bg-white transition-all hover:ring-2 hover:ring-white hover:ring-offset-black mx-auto lg:mx-0"
          >
            <span className="text-center text-black text-base font-medium">
              Shop Now
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start mt-4 w-full">
            <TitleDescription title="200+" description="International Brands" />
            <TitleDescription
              title="2,000+"
              description="High-Quality Products"
            />
            <TitleDescription title="30,000+" description="Happy Customers" />
          </div>
        </div>
        <div className="flex items-center justify-center w-2/3">
          <img alt="product" src={HomeProduct.src} />
        </div>
      </div>
    </div>
  );
};

export default TopSection;
const TitleDescription = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col">
      <span className="text-[40px] font-bold text-white">{title}</span>
      <span className="text-baes font-normal text-white">{description}</span>
    </div>
  );
};
