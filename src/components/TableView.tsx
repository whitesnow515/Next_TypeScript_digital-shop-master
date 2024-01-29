import React, { useEffect } from "react";

import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import { Meta } from "@components/templates/Meta";
import moment from "moment";
import { useRouter } from "next/router";
import { ArrowDown, ArrowUp } from "phosphor-react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { OrderInterface } from "@app-types/models/order";
import { Switch } from "@mui/material";
import OrderStatus from "@components/OrderStatus";

const RenderStatus = ({ status }: { status: string }) => {
  if (status === "completed" || status === "complete") {
    return (
      <span className=" text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-green-900 text-green-300">
        Complete
      </span>
    );
  }
  if (status === "awaiting-verification") {
    return (
      <span className="text-xs whitespace-nowrap font-medium me-2 px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
        Awaiting Verification
      </span>
    );
  }
  return (
    <span className="text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
      Pending
    </span>
  );
};
const getProducts = (subOrders: any) => {
  try {
    if (subOrders.length > 1) {
      return `${subOrders[0].productName} - ${subOrders[0].productOption} and ${
        subOrders.length - 1
      } more`;
    }
    return `${subOrders[0].productName} - ${subOrders[0].productOption}`;
  } catch (e) {
    return `Unknown`;
  }
};
const TableView = ({
  orders,
  page,
  count,
  pages,
  status,
  sort,
  filterValues,
  search,
  date_to,
  date_from,
}: any) => {
  const session = useSession();
  const [page_, setPage] = React.useState(page);
  const [allOrders, setAllOrders] = React.useState<any>(orders);
  const [currentItems, setCurrentItems] = React.useState<any>();
  const [status_, setStatus] = React.useState(status);
  const [search_, setSearch] = React.useState(search);
  const [searchPaymentMethod, setSearchPaymentMethod] = React.useState("");
  const [searchOrder, setSearchOrder] = React.useState("");
  const [searchStatus, setSearchStatus] = React.useState("");
  const [sort_, setSort] = React.useState(sort);
  const [order, setOrder] = React.useState("desc");
  const [dateFrom, setDateFrom] = React.useState<any>(date_from);
  const [dateTo, setDateTo] = React.useState(date_to);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [maxRows, setMaxRows] = React.useState(20);
  const [limit, setLimit] = React.useState(20);
  const [showDate, setShowdate] = React.useState(false);
  const [showPending, setShowPending] = React.useState(false);
  const [showPayment, setShowPayment] = React.useState(false);
  const uniquePaymentMethods: Set<string> = new Set(
    orders.map((data: any) => data.paymentMethod)
  );
  const itemsPerPage = 12;
  const pageRangeDisplayed = 5;
  // Calculate the indexes for the current page
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  useEffect(() => {
    if (showPending) {
      setStatus("pending");
    } else {
      setStatus("");
    }
  }, [showPending]);
  useEffect(() => {
    const filterAndSortOrders = () => {
      const filteredOrders = orders?.filter((o: OrderInterface) => {
        if (!o) {
          return false;
        }

        const orderDate = new Date(o.timestamp).valueOf();
        if (
          (dateFrom && orderDate < new Date(dateFrom).valueOf()) ||
          (dateTo && orderDate > new Date(dateTo).valueOf())
        ) {
          return false;
        }

        if (searchOrder) {
          const searchLower = searchOrder.toLowerCase();
          const address = o.metadata?.crypto_address?.toLowerCase();
          const uniqId = o.metadata?.uinqid?.toLowerCase();
          const orderId = o?._id?.toString();
          const email = o?.email?.toString();
          const paymentMethod = o?.paymentMethod?.toString();

          return (
            address?.includes(searchLower) ||
            uniqId?.includes(searchLower) ||
            orderId?.includes(searchLower) ||
            email?.includes(searchLower) ||
            paymentMethod?.includes(searchLower)
          );
        } else if (searchStatus) {
          return o.status?.toLowerCase()?.includes(searchStatus.toLowerCase());
        } else if (searchPaymentMethod) {
          return o.paymentMethod
            ?.toLowerCase()
            ?.includes(searchPaymentMethod.toLowerCase());
        } else {
          return true;
        }
      });
      return filteredOrders?.slice(startIndex, endIndex);
    };

    setCurrentItems(filterAndSortOrders());
  }, [
    dateFrom,
    dateTo,
    orders,
    order,
    searchStatus,
    searchPaymentMethod,
    startIndex,
    endIndex,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const [filters_, setFilters] = React.useState(
    filterValues ? filterValues : {}
  );
  const router = useRouter();

  const to = currentPage * 10 + 10;

  React.useEffect(() => {
    var query: any = {};
    if (page_ > 1) {
      query.page = page_;
    }
    if (status_ && status_ !== "all") {
      query.status = status_;
    }
    if (sort_) {
      query.sort = sort_;
    }
    if (search_) {
      query.search = search_;
    }
    if (searchOrder) {
      query.search = searchOrder;
    }
    if (dateTo) {
      query.date_to = new Date(dateTo).toISOString().split("T")[0];
    }
    if (dateFrom) {
      query.date_from = new Date(dateFrom).toISOString().split("T")[0];
    }
    if (order) {
      query.sort = order;
    }

    for (var filter of Object.keys(filters_)) {
      if (filters_[filter]) {
        query[filter] = filters_[filter];
      }
    }

    router.query = query;
    router.push(router);
  }, [
    page_,
    status_,
    sort_,
    search_,
    filters_,
    dateTo,
    dateFrom,
    searchOrder,
    order,
  ]);
  // orders.filter((data) => data.email === searchOrder);
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
        setShowdate(false);
        setShowPayment(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <AdminNavProvider session={session}>
      <Meta
        title={
          router.pathname === "/admin/queue/list"
            ? `Verification Queue`
            : `Orders`
        }
        description={"Admin orders list page "}
      />
      <div>
        <div className="flex items-center justify-between">
          <h1 className={"text-2xl mt-2.5 font-bold"}>
            {router.pathname === "/admin/queue/list"
              ? `Verification Queue`
              : `Orders`}
          </h1>
          {router.pathname !== "/admin/queue/list" && (
            <div className="flex items-center gap-2">
              <p>Complete</p>
              <Switch
                checked={showPending}
                onChange={() => setShowPending((y) => !y)}
              />
              <p>Pending</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <>
            <div
              className={
                "flex items-center  max-lg:flex-col max-lg:justify-left gap-3"
              }
            >
              <div className="text-sm">
                <p>Date From</p>
                <input
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={
                    "bg-transparent max-lg:mr-auto py-1 rounded-[4px] outline-none focus:ring-none calendar-input md:w-[120px] text-white"
                  }
                  type={"date"}
                />
              </div>
              <div className="text-sm">
                <p>Date From</p>
                <input
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={
                    "bg-transparent max-lg:mr-auto py-1 rounded-[4px] outline-none focus:ring-none calendar-input md:w-[134px]  text-white"
                  }
                  type={"date"}
                />
              </div>
            </div>
            <div className="md:w-[30%] w-[50%]">
              <div className=" px-2 py-2 border border-[#6A6B74] flex items-center gap-1 rounded-full hover:border-[#9799A6] bg-white">
                <img className="w-5 h-5" src="/assets/images/search-icon.svg" />
                <input
                  type="text"
                  autoComplete="off"
                  aria-autocomplete="none"
                  name={`yourFieldName_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`}
                  id="search"
                  className="outline-none hover-circle sm:text-sm bg-transparent block w-full placeholder-black text-black focus:border-[#FFFFFF] duration-150"
                  placeholder={
                    "Search by order id, address, transaction id....."
                  }
                  onChange={(e) => {
                    setSearchOrder(e.target.value);
                  }}
                ></input>
              </div>
            </div>
          </>
        </div>

        <div
          className={
            "bg-[#1F2421] border border-[#303633] w-full rounded-md px-0 py-2 mt-4"
          }
        >
          <div className={"overflow-x-auto h-auto"}>
            <Table className={"w-full text-left relative"}>
              <Thead>
                <Tr className={"border-b border-[#404242]"}>
                  <Th className={"p-2 pl-5 box-border"}>ID</Th>
                  <Th>Product</Th>
                  <Th>
                    <p className="px-3">Amount</p>
                  </Th>
                  <Th>
                    <div className="relative">
                      <button
                        id="dropdown-button"
                        onClick={() => setShowdate(!showDate)}
                      >
                        Status
                      </button>
                      {showDate && router.pathname !== "/admin/queue/list" && (
                        <div
                          id="modal-id"
                          className="bg-[#1F2421] flex flex-col w-[200px] absolute"
                          style={{ zIndex: "999" }}
                        >
                          <button
                            onClick={() => {
                              setSearchStatus("");
                              setShowdate(false);
                              setCurrentPage(1);
                            }}
                            className="p-2 font-normal text-sm text-start hover:bg-white hover:text-black"
                          >
                            All
                          </button>
                          <button
                            onClick={() => {
                              setSearchStatus("awaiting-verification");
                              setShowdate(false);
                              setCurrentPage(1);
                            }}
                            className="p-2 font-normal text-sm text-start hover:bg-white hover:text-black"
                          >
                            Awaiting Verification
                          </button>
                          <button
                            onClick={() => {
                              setSearchStatus("Complete");
                              setShowdate(false);
                              setCurrentPage(1);
                            }}
                            className="p-2 font-normal text-sm text-start hover:bg-white hover:text-black"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </Th>
                  <Th>Customer</Th>
                  <Th>
                    {/* <p className="px-2">Payment method</p> */}
                    <div className="relative whitespace-nowrap pr-4">
                      <button
                        id="dropdown-button"
                        onClick={() => setShowPayment(!showPayment)}
                      >
                        Payment Method
                      </button>
                      {showPayment && (
                        <div
                          id="modal-id"
                          className="bg-[#1F2421] flex flex-col w-[200px] absolute"
                          style={{ zIndex: "999" }}
                        >
                          <button
                            onClick={() => {
                              setSearchPaymentMethod("");
                              setShowPayment(false);
                            }}
                            className="p-2 font-normal text-sm text-start hover:bg-white hover:text-black"
                          >
                            All
                          </button>
                          {Array.from(uniquePaymentMethods).map((data: any) => (
                            <button
                              onClick={() => {
                                setSearchPaymentMethod(data);
                                setShowPayment(false);
                              }}
                              className="p-2 font-normal text-sm text-start hover:bg-white hover:text-black"
                            >
                              {data}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Th>
                  <Th>Paid at</Th>
                  <Th>
                    <button
                      onClick={() => {
                        setOrder((prevOrder) =>
                          prevOrder === "asc" ? "desc" : "asc"
                        );
                      }}
                      className="pr-5 flex items-center gap-2 pl-2"
                    >
                      <span>Date</span>
                      {order === "asc" ? <ArrowUp /> : <ArrowDown />}
                    </button>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentItems?.map((order: any) => (
                  <Tr
                    onClick={() => {
                      router.push(`/admin/orders/${order._id}`);
                    }}
                    className={
                      "border-b text-sm border-[#404242] hover:cursor-pointer  hover:cursor-pointer hover:bg-[#303633] hover:opacity-80 last:border-none"
                    }
                  >
                    <Td className={"p-2 pl-5 box-border"}>{order._id}</Td>
                    <Td>{getProducts(order.subOrders)}</Td>
                    <Td>
                      <div className={"flex items-center px-3 gap-3"}>
                        <div className={"flex-1"}>
                          <b> ${order.totalPrice.toFixed(2)}</b>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className={"flex-1"}>
                        <OrderStatus status={order.status} />
                      </div>
                    </Td>
                    <Td>
                      {order.email} {!order.user && "(Guest)"}
                    </Td>
                    <Td>
                      <p className="px-2">{order?.paymentMethod}</p>
                    </Td>
                    <Td>
                      <p className="whitespace-nowrap">
                        {order.timestamp
                          ? moment(order.timestamp).format("lll")
                          : "Not paid"}
                      </p>
                    </Td>
                    <Td className="pr-5 pl-2">
                      <p className="whitespace-nowrap">
                        {moment(order.timestamp).format("lll")}
                      </p>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
          {orders?.length === 0 && (
            <div className={"text-gray-300 ml-5 my-3 text-sm"}>
              No records found
            </div>
          )}
          {orders?.length > 0 && (
            <div
              className={
                "flex justify-between text-sm mt-2 items-center px-5 py-3"
              }
            >
              <div className={"text-white"}>
                Showing {page === 1 ? 0 : (page - 1) * 10} to{" "}
                {page > 1 ? (to > count ? count : to) : count < 10 ? count : 10}{" "}
                of {count} records
              </div>
              <div className={"flex items-center gap-3"}>
                {!search && (
                  <div className="flex justify-end gap-5 mb-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-md px-2 md:px-3.5 py-2"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={endIndex >= orders.length}
                      className="font-bold hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white text-sm text-center flex shrink-0 items-center justify-center gap-2 rounded-md px-2 md:px-3.5 py-2"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminNavProvider>
  );
};

export default TableView;
