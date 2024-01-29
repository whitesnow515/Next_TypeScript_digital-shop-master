import { OrderInterface, SubOrderInterface } from "@app-types/models/order";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

const CustomPagination = ({ data, setCurrenItems, search }: any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const itemsPerPage = 12;
  const pageRangeDisplayed = 5;
  const totalPages = Math.ceil(data && data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const filteredOrders = data?.filter((o: OrderInterface) => {
    if (!o.subOrders) {
      return false;
    }
    let found = false;

    const orderId = o._id?.toString().toLowerCase();
    const searchLower = search.toLowerCase();

    // Check if orderId matches the search query
    if (orderId?.includes(searchLower)) {
      return true;
    }

    for (let i = 0; i < o.subOrders.length; i += 1) {
      const orderData = o.subOrders[i] as SubOrderInterface;
      const productName = orderData.productName.toLowerCase();
      const productQuantity = orderData.productQuantity.toString();
      const productOption = orderData.productOption.toLowerCase();
      const totalPrice = o.totalPrice?.toString();
      const paymentMethod = o.paymentMethod?.toLowerCase();
      const status = o.status?.toLowerCase();

      const result =
        productName.includes(searchLower) ||
        productQuantity.includes(searchLower) ||
        productOption.includes(searchLower) ||
        totalPrice?.includes(searchLower) ||
        paymentMethod?.includes(searchLower) ||
        status?.includes(searchLower) ||
        o.subOrders[i]?.product?.toString().includes(searchLower);

      if (result) {
        found = true;
        break;
      }
    }

    return found;
  });

  const sorted = filteredOrders?.sort((x: any, y: any) => {
    return new Date(y.timestamp).valueOf() - new Date(x.timestamp).valueOf();
  });

  const allSubOrdersWithOrderId =
    sorted &&
    sorted
      .map(
        (o: OrderInterface) =>
          o.subOrders &&
          o.subOrders.map((subOrder: SubOrderInterface) => ({
            orderId: o._id,
            orderStatus: o.status,
            ...subOrder,
          }))
      )
      .flat()
      .filter(
        (
          orderData: SubOrderInterface & {
            orderId: string;
            orderStatus: string;
          }
        ) => {
          const productName = orderData.productName.toLowerCase();
          const productQuantity = orderData.productQuantity.toString();
          const productOption = orderData.productOption.toLowerCase();
          const productId = orderData.product?.toString();
          const orderStatus = orderData.orderStatus?.toLowerCase();
          const searchLower = search.toLowerCase();
          const result =
            productName.includes(searchLower) ||
            productQuantity.includes(searchLower) ||
            productOption.includes(searchLower) ||
            orderData.orderId?.includes(searchLower) ||
            orderStatus.includes(searchLower) ||
            orderData.product?.toString().includes(searchLower);
          return result;
        }
      );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrenItems(
      allSubOrdersWithOrderId &&
        allSubOrdersWithOrderId.slice(startIndex, endIndex)
    );
  }, [currentPage, search]);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const halfRange = Math.floor(pageRangeDisplayed / 2);

    if (totalPages <= pageRangeDisplayed) {
      // Display all pages if the total number of pages is less than or equal to the range
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            disabled={currentPage === i}
            className={
              currentPage === 1
                ? "bg-[#3A3C3B] text-white text-sm rounded-md h-[20px] w-[20px] md:w-[32px] md:h-[32px]"
                : "text-white hover:bg-[#3A3C3B] text-sm h-[20px] w-[20px] rounded-md"
            }
          >
            {i}
          </button>
        );
      }
    } else {
      // Display a dynamic range of pages with ellipsis indicators
      let start = Math.max(1, currentPage - halfRange);
      let end = Math.min(totalPages, start + pageRangeDisplayed - 1);

      if (end - start < pageRangeDisplayed - 1) {
        start = Math.max(1, end - pageRangeDisplayed + 1);
      }

      if (start > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => handlePageChange(1)}
            className={
              currentPage === 1
                ? "bg-[#3A3C3B] text-white text-sm rounded-md md:h-[32px] md:w-[32px] h-[20px] w-[20px]"
                : "text-white hover:bg-[#3A3C3B] text-sm md:h-[32px] md:w-[32px] h-[20px] w-[20px] rounded-md"
            }
          >
            1
          </button>
        );
        if (start > 2) {
          pageNumbers.push(
            <span key={`ellipsis-start`} className="ellipsis text-[#64656E]">
              ...
            </span>
          );
        }
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={
              currentPage === i
                ? "bg-[#3A3C3B] text-white text-sm rounded-md md:h-[32px] md:w-[32px] h-[20px] w-[20px]"
                : "text-white hover:bg-[#3A3C3B] text-sm md:h-[32px] md:w-[32px] h-[20px] w-[20px] rounded-md"
            }
          >
            {i}
          </button>
        );
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pageNumbers.push(
            <span key={`ellipsis-end`} className="ellipsis text-[#64656E]">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => handlePageChange(totalPages)}
            className={
              currentPage === totalPages
                ? "bg-[#3A3C3B] text-white text-sm rounded-md md:h-[32px] md:w-[32px] h-[20px] w-[5px]"
                : "text-white hover:bg-[#3A3C3B] text-sm md:h-[32px] md:w-[32px] h-[20px] w-[5px] rounded-md"
            }
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };
  if (!search) {
    return (
      <div className="flex border-t w-full border-white justify-center mt-24">
        <div className="flex w-full gap-2 justify-between mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-2xl px-2 md:px-3.5 py-2"
          >
            <ArrowLeftIcon className="h-4 w-4 md:w-auto md:h-auto" />
            Back
          </button>
          <div className="gap-2 md:gap-7 items-center flex">
            {renderPageNumbers()}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={endIndex >= data?.length}
            className="font-bold hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-2xl px-2 md:px-3.5 py-2"
          >
            Next
            <ArrowRightIcon className="h-4 w-4 md:w-auto md:h-auto" />
          </button>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};
export default CustomPagination;
