import { ButtonLink } from "@components/ButtonLink";
import Product from "@components/Product";
import TopTitle from "@components/typography/TopTitle";
import { Grid } from "@mui/material";
import Link from "next/link";
import { ArrowRight } from "phosphor-react";

const Arrivals = ({
  featuredProducts,
  title,
  data,
  style,
}: {
  featuredProducts: any;
  title: string;
  data?: any;
  style?: any;
}) => {

  return (
    <div className="bg-primaryBlack-400 flex items-center justify-center w-full">
      <div
        className={`${style} flex flex-col gap-6 py-[62px] px-5 w-[400px] sm:w-[600px] md:w-[900px] lg:w-[1020px] xl:w-[1300px] mx-auto`}
      >
        <TopTitle title={title} />
        <div
          x-data="{}"
          x-init="$nextTick(() => {
    let ul = $refs.products;
    ul.insertAdjacentHTML('afterend', ul.outerHTML);
    ul.nextSibling.setAttribute('aria-hidden', 'true');
  })"
          className="w-full inline-flex flex-wrap overflow-x-auto hide-scrollbar"
        >
          {data.length > 0 ? (
            <div
              x-ref="products"
              className="flex items-center py-3 gap-4 justify-center animate-infinite-scroll sm:justify-start"
            >
              {data &&
                data.map((item: any, index: number) => (
                  <div
                    className=" w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/4 mb-4 shrink-0"
                    key={index}
                  >
                    <Product
                      name={item.name}
                      price={2}
                      image={item.image}
                      stock={20}
                      defaultImage={data?.defaultImage}
                      featured={
                        featuredProducts &&
                        featuredProducts.filter(
                          (data: any) => data._id === item._id
                        ).length > 0
                      }
                    />
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-white">No products available</p>
          )}
        </div>

        <Link
          href="/products"
          className="border border-[#FFFFFF33] hover:ring-1 hover:ring-white rounded-[62px] max-w-max py-4 px-[54px] text-base text-white text-center flex items-center font-medium mx-auto h-[52px]"
        >
          View All
        </Link>
      </div>
    </div>
  );
};

export default Arrivals;
