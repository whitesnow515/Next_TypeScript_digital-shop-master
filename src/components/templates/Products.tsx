import React, { useContext, useEffect, useState } from "react";

import {
  CircularProgress,
  Pagination,
  PaginationItem,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { DebounceInput } from "react-debounce-input";
import { FullProductInterfaceWithOption } from "@app-types/models/product";
import Product from "@components/Product";
import { getSettingClient } from "@util/ClientUtils";
import { SearchContext } from "@pages/_app";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

interface ProductsProps {
  allProducts?: FullProductInterfaceWithOption[];
  featuredProductsData?: FullProductInterfaceWithOption[];
  search: string;
  setSearch: React.Dispatch<string>;
}
// extract props of HTMLInputElement | DebounceInput
const FixedDebounceInput: any = DebounceInput;
const Products = ({
  featuredProductsData,
  setProductCount,
  category,
}: ProductsProps & { setProductCount: any; category: "all" | string }) => {
  const { search, setSearch } = useContext(SearchContext);

  const [defaultImage, setDefaultImage] = React.useState("");
  useEffect(() => {
    getSettingClient("defaultImage", "/default.gif").then((img) => {
      setDefaultImage(img);
    });
  }, []);

  const [productsData, setProductsData] = useState(
    [] as FullProductInterfaceWithOption[]
  );
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [canSearch, setCanSearch] = useState(false);
  const [maxPages, setMaxPages] = useState(1);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const pageRangeDisplayed = 5;
  // Calculate the indexes for the current page
  const totalPages = Math.ceil(productsData.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  let filterProducts = [
    ...productsData?.filter((x: any) => {
      if (category === "all") {
        return true;
      }
      return x.category && x.category._id === category;
    }),
  ];

  useEffect(() => {
    if (canSearch) return;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has("page"))
      setPage(parseInt(urlParams.get("page") as string, 10));
    if (urlParams.has("search")) setSearch(urlParams.get("search") as string);
    if (urlParams.has("limit"))
      setLimit(parseInt(urlParams.get("limit") as string, 10));
    setCanSearch(true);
  }, []);

  const runSearch = async () => {
    if (!canSearch) {
      return;
    }
    const productSearch = document.getElementById("product-search");
    productSearch?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        window.location.href = `/?search=${
          (productSearch as HTMLInputElement).value
        }`;
      }
    });
    const newSearchParams = new URLSearchParams();
    if (page !== 1) newSearchParams.append("page", page.toString());
    if (search !== "") newSearchParams.append("search", search);
    if (limit !== 16) newSearchParams.append("limit", limit.toString());
    const param = newSearchParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${param ? `?${param}` : ""}`
    );
    const search2 = new URLSearchParams(window.location.search);
    search2.set("page", (page - 1).toString());
    search2.set("hideFeatured", search ? "false" : "true");
    search2.set("sortByLastStocked", "true");
    axios
      .get(`/api/products/get?${search2.toString()}&category=${category}`)
      .then((res) => {
        setProductsData(res.data.data);
        setProductCount(res.data.data);
        setMaxPages(res.data.maxPage);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    runSearch();
  }, [page, canSearch, search, category]);
  return (
    <div
      id="products"
      className={`flex flex-col gap-10 w-full h-full relative mx-auto px-2 ${
        !loading && "mt-2"
      }`}
    >
      <div>
        {filterProducts.length > 0 ? (
          <div
            className={`gap-4 grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`}
          >
            {filterProducts.map(
              (p: FullProductInterfaceWithOption, index: number) => {
                return (
                  <Product
                    key={index}
                    name={p.name}
                    stock={p.stock}
                    price={p.price}
                    image={p.image}
                    defaultImage={defaultImage}
                    oos={p.options.length === 0}
                    featured={
                      featuredProductsData &&
                      featuredProductsData?.filter((data) => data._id === p._id)
                        ?.length > 0
                    }
                  />
                );
              }
            )}
          </div>
        ) : (
          <div
            className={`gap-5 lg:gap-5 flex flex-wrap grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`}
          >
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((data) => (
                  <div className="object-contain shrink-0">
                    <div>
                      <Skeleton
                        variant="rectangular"
                        className="sm:w-[100%] md:w-full lg:w-full xl:w-[100%] 2xl:w-[100%] h-[8rem] sm:h-[10rem] md:h-[28vh] lg:h-[24vh] xl:h-[180px]"
                      />
                    </div>
                    <div className="w-[60%] mt-3">
                      <Skeleton variant="text" />
                      <Skeleton width={30} variant="text" />
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {filterProducts.length === 0 && !loading && (
              <span className="text-white">No products found</span>
            )}
          </div>
        )}
      </div>
      <div
        className={`flex flex-col ${
          filterProducts.length > 0 && "border-t"
        } border-[#404242] w-full`}
      >
        {filterProducts.length > 0 && (
          <div className="flex justify-between w-full mt-6">
            <div>
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1}
                className="font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-2xl px-3.5 py-2"
              >
                <ArrowLeftIcon />
                <span className="text-sm font-bold text-white">Previous</span>
              </button>
            </div>
            <Pagination
              count={maxPages}
              page={page}
              shape="rounded"
              className="flex"
              size="large"
              hideNextButton={true}
              hidePrevButton={true}
              onChange={(_e, p) => {
                setPage(p);
              }}
            />
            <div>
              <button
                // disabled={endIndex >= productsData.length}
                onClick={() => setPage((prev) => Math.min(prev + 1, maxPages))}
                className="font-bold hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-2xl px-3.5 py-2"
              >
                <span className="text-sm font-bold text-white">Next</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
