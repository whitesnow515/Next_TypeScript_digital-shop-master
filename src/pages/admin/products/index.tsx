import React from "react";

import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import { Meta } from "@components/templates/Meta";
import { useRouter } from "next/router";
import getUserModel from "@models/user";
import { Trash, X } from "phosphor-react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import Notes from "@components/admin/Notes";
import getProductModel from "@models/product";
import getOrderModel from "@models/order";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { requireLoggedInSSP } from "@util/AuthUtils";
import RequireRole from "@components/auth/RequireRole";
import Swal from "sweetalert2";
import { useSnackbar } from "notistack";

const RenderStatus = ({ status }: { status: string }) => {
  if (status === "paid") {
    return (
      <span className=" text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-green-900 text-green-300">
        Credited
      </span>
    );
  }
  return (
    <span className="text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
      Pending
    </span>
  );
};
const OrderPage = ({
  products,
  stats,
  page,
  count,
  pages,
  status,
  date_from,
  product_title,
  option_title,
  date_to,
  sort,
  user,
  users,
  search,
}: any) => {
  const session = useSession();
  const [page_, setPage] = React.useState(page);
  const [status_, setStatus] = React.useState(status);
  const [search_, setSearch] = React.useState(search);
  const [user_, setUser] = React.useState(user);
  const [sort_, setSort] = React.useState(sort);
  const [dropdown, setDropdown] = React.useState(null);
  const [notes, setNotes] = React.useState<string>();
  const [notesUser, setNotesUser] = React.useState();
  const [notesOpen, setNotesOpen] = React.useState<boolean>();
  const [dateFrom, setDateFrom] = React.useState(date_from);
  const [dateTo, setDateTo] = React.useState(date_to);
  const [productTitle, setProductTitle] = React.useState(product_title);
  const [optionTitle, setOptionTitle] = React.useState(option_title);
  const Snackbar = useSnackbar();
  const router = useRouter();
  const to = page * 10 + 10;

  const markAsPaid = (id: string) => {
    var req = axios.post(`/api/admin/top_up/${id}/mark_as_paid/`);
    setDropdown(null);

    toast.promise(
      new Promise((resolve, reject) => {
        req
          .then((t) => {
            router.replace(router.asPath);
            resolve(t);
          })
          .catch(reject);
      }),
      {
        success: "Order marked as paid",
        loading: "Marking order as paid...",
        error: "Could not process request",
      }
    );
  };
  const leaveNotes = (id: string) => {
    return new Promise((resolveFinal, rejectFinal) => {
      var req = axios.post(`/api/admin/top_up/${id}/notes/`, { notes });

      toast.promise(
        new Promise((resolve, reject) => {
          req
            .then((t) => {
              router.replace(router.asPath);
              resolve(t);
              resolveFinal(true);
            })
            .catch((e) => {
              reject(e);
              rejectFinal(e);
            });
        }),
        {
          success: "Notes saved",
          loading: "Saving changes...",
          error: "Could not process request",
        }
      );
    });
  };

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
    if (user_) {
      query.user = user_;
    }
    if (dateTo) {
      query.date_to = new Date(dateTo).toISOString().split("T")[0];
    }
    if (dateFrom) {
      query.date_from = new Date(dateFrom).toISOString().split("T")[0];
    }
    if (optionTitle) {
      query.option_title = optionTitle;
    }
    if (productTitle) {
      query.product_title = productTitle;
    }
    router.query = query;
    router.push(router);
  }, [
    page_,
    status_,
    sort_,
    search_,
    user_,
    dateTo,
    dateFrom,
    productTitle,
    optionTitle,
  ]);

  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        {notesOpen && (
          <Notes
            user={notesUser}
            handleSubmit={leaveNotes}
            notes={notes}
            setNotes={setNotes}
            setOpen={setNotesOpen}
            key={"notesModal"}
          />
        )}
        <Toaster />
        <Meta title={`Top Ups`} description={"Admin top ups page"} />
        <div>
          <h1 className={"text-2xl mt-2.5 font-bold"}>Products</h1>
          <div
            className={
              "border mt-6 text-sm border-gray-600 flex flex-wrap items-center gap-7 p-2 px-4 py-4"
            }
          >
            <div>
              <div className={"flex items-center gap-2"}>
                <div className={"text-white"}>Sort by</div>

                {sort_ && (
                  <X
                    onClick={() => {
                      setSort("");
                    }}
                    size={16}
                    color={"white"}
                  />
                )}
              </div>
              <select
                value={sort_}
                onChange={(e) => {
                  setSort(e.target.value);
                }}
                className={
                  "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px] min-w-[150px] text-white"
                }
              >
                <option value={""}>Default</option>
                <option value={"timesBought"}>Times bought</option>
                <option value={"totalStockLines"}>Stock</option>
              </select>
            </div>
            <div>
              <div className={"flex flex-wrap items-center gap-2"}>
                <div className={"text-white"}>Date</div>
                {(dateFrom || dateTo) && (
                  <X
                    className={"hover:cursor-pointer"}
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                    size={16}
                    color={"white"}
                  />
                )}
              </div>
              <div className={"flex flex-wrap items-center gap-3"}>
                <input
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={
                    "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
                  }
                  type={"date"}
                />
                -
                <input
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={
                    "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
                  }
                  type={"date"}
                />
              </div>
            </div>
            <div>
              <div className={"flex items-center gap-2"}>
                <div className={"text-white"}>Product Title</div>
              </div>
              <input
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className={
                  "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
                }
              />
            </div>
            <div>
              <div className={"flex items-center gap-2"}>
                <div className={"text-white"}>Option Title</div>
              </div>
              <input
                value={optionTitle}
                onChange={(e) => setOptionTitle(e.target.value)}
                className={
                  "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
                }
              />
            </div>
          </div>
          <div
            className={
              "border mt-6 flex items-center gap-6 text-sm border-gray-600 flex items-center gap-7 p-2 px-4 py-4"
            }
          >
            <div
              className={
                "w-full text-xl bg-[#303633] h-[150px] flex justify-center items-center"
              }
            >
              Total Sold: ${stats.totalPrice.toFixed(2)}
            </div>
            <div
              className={
                "w-full text-xl  bg-[#303633] h-[150px] flex justify-center items-center"
              }
            >
              Total Stock Sold: {stats.productQuantity}x
            </div>
          </div>
          <div className={" border border-gray-600  rounded-md px-0 py-2 mt-4"}>
            <div className="w-full overflow-auto hide-scrollbar">
              <Table className={"w-full text-left"}>
                <Thead>
                  <Tr className={"border-b whitespace-nowrap border-[#404242]"}>
                    <Th className={"p-2 pl-5 box-border"}>ID</Th>

                    <Th>Product</Th>
                    <Th>Short description</Th>

                    <Th>Options</Th>
                    <Th>Total Stock Sold</Th>
                    <Th>Total Sold</Th>

                    <Th>Current stock</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {products.map((prod: any) => (
                    <Tr
                      onClick={() => router.push(`/admin/products/${prod._id}`)}
                      className={
                        "hover:cursor-pointer whitespace-nowrap hover:bg-[#303633] border-b text-sm border-[#404242] last:border-none"
                      }
                    >
                      <Td className={"p-2 pl-5 box-border"}>{prod._id}</Td>
                      <Td>{prod.name}</Td>
                      <Td>
                        {prod.shortDescription ? prod.shortDescription : "None"}
                      </Td>

                      <Td>{prod.options.length}</Td>
                      <Td>{parseInt(prod.totalSold) ? prod.totalSold : "0"}</Td>
                      <Td>
                        $
                        {parseInt(prod.totalSoldPrice)
                          ? prod.totalSoldPrice.toFixed(2)
                          : "0.00"}
                      </Td>

                      <Td>{prod.totalStockLines}x</Td>

                      <Td className={"relative z-30"}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            Swal.fire({
                              title: "Are you sure?",
                              html: `You are deleting the product "${prod.name}".\nThis will also delete any (un-purchased) associated stock & options!`,
                              icon: "warning",
                              showCancelButton: true,
                            }).then((result) => {
                              if (result.isConfirmed) {
                                axios
                                  .post("/api/products/delete/", {
                                    id: prod._id,
                                  })
                                  .then((res) => {
                                    if (res.data.success) {
                                      Snackbar.enqueueSnackbar(
                                        "Product deleted",
                                        {
                                          variant: "success",
                                        }
                                      );

                                      window.location.reload();
                                    } else {
                                      Swal.fire({
                                        title: "Error!",
                                        text: res.data.message,
                                        icon: "error",
                                      });
                                    }
                                  })
                                  .catch((err) => {
                                    Swal.fire({
                                      title: "Error!",
                                      text: err.message,
                                      icon: "error",
                                    });
                                  });
                              }
                            });
                          }}
                          className={"flex items-center gap-3"}
                        >
                          <Trash color={"darkred"} size={24} weight={"bold"} />
                        </button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>

            {products.length === 0 && (
              <div className={"text-gray-300 ml-5 my-3 text-sm"}>
                No records found
              </div>
            )}
            {products.length === 0 && (
              <div
                className={
                  "flex justify-end text-sm mt-2 items-center px-5 py-3"
                }
              >
                <div className={"flex items-center gap-3"}>
                  <button
                    onClick={() => {
                      router.push("/admin/products/new");
                    }}
                    className={`bg-blue-600 px-2 py-1.5 rounded-[5px] hover:cursor-pointer`}
                  >
                    Add New
                  </button>
                </div>
              </div>
            )}
            {products.length > 0 && (
              <div
                className={
                  "flex justify-between text-sm mt-2 items-center px-5 py-3"
                }
              >
                <div className={"text-white"}>
                  Showing{" "}
                  {page > 1
                    ? to > count
                      ? count
                      : to
                    : count < 10
                    ? count
                    : 10}{" "}
                  of {count} records
                </div>
                <div className={"flex flex-wrap items-center gap-3"}>
                  <button
                    onClick={() => {
                      router.push("/admin/products/new");
                    }}
                    className={`bg-blue-600 px-2 py-1.5 rounded-[5px] hover:cursor-pointer`}
                  >
                    Add New
                  </button>
                  <div
                    onClick={() => {
                      if (pages === 1) return;
                      (router.query.page as any) = page - 1;
                      router.push(router);
                    }}
                    className={`bg-blue-600 px-2 py-1.5 rounded-[5px] hover:cursor-pointer ${
                      page == 1 && "opacity-60 pointer-events-none"
                    }`}
                  >
                    Back
                  </div>
                  <div
                    onClick={() => {
                      let nextpage = page + 1 > pages;
                      if (nextpage) return;
                      router.query.page = page + 1;
                      router.push(router);
                    }}
                    className={`bg-blue-600 px-2 py-1.5 rounded-[5px]  hover:cursor-pointer ${
                      page + 1 > pages && "opacity-60 pointer-events-none"
                    }`}
                  >
                    Next
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RequireRole>
    </AdminNavProvider>
  );
};

const getPage = (query: { page?: string }): number => {
  if (!query.page) {
    return 1;
  }

  if (!parseInt(query.page)) {
    return 1;
  }
  return parseInt(query.page);
};
const getQuery = (context: any) => {
  var { date_to, date_from, option_title, product_title } = context.query;
  var query: any = {};
  if (date_to) {
    query["timestamp"] = {};
    query["timestamp"]["$lt"] = new Date(date_to);
  }
  if (date_from) {
    query["timestamp"] = {};

    query["timestamp"]["$gte"] = new Date(date_from);
  }
  if (option_title) {
    query["subOrders.productOption"] = { $regex: option_title, $options: "i" };
  }
  if (product_title) {
    query["subOrders.product"] = { $regex: product_title, $options: "i" };
  }
  if (!product_title) {
    product_title = null;
  }
  if (!option_title) {
    option_title = null;
  }

  return { query, date_to, date_from, product_title, option_title };
};
const getQueries = (query: any) => {
  let { status, sort, search, user, date_to, date_from } = query;
  var queries: any = {};
  // if (date_from || date_to) {
  //   queries.timestamp = {
  //
  //   }
  //   if (date_to) {
  //     queries.timestamp['$lt']= new Date(date_to)
  //   }
  //   if (date_from) {
  //     queries.timestamp['$gte']= new Date(date_from)
  //   }
  // }
  if (["paid", "pending"].includes(status)) {
    queries["status"] = status;
  }
  if (["totalStockLines", "timesBought"].includes(sort)) {
    queries["sort"] = sort;
  }
  if (search) {
    queries.search = search;
  }
  if (user) {
    queries.user = user;
  }

  return queries;
};

export const getServerSideProps = async (context: any) => {
  // this checks if one of the roles is found, not that every role must be present
  const token = await requireLoggedInSSP(
    context.req,
    context.res,
    ["admin", "super_admin"],
    true
  );

  if (!token) {
    return {
      redirect: {
        permanent: false,
        destination: "/admin/orders/list",
      },
    };
  }

  if (!token.user.roles.includes("admin")) {
    return {
      redirect: {
        permanent: false,
        destination: "/admin/",
      },
    };
  }
  let userModel = await getUserModel();

  let page = await getPage(context.query);
  let queries = await getQueries(context.query);
  let Order = await getOrderModel();
  let productmodel = await getProductModel();

  let prodcount = await productmodel.count({ ...queries });
  let queries_ = queries;
  let sort = queries.sort;
  delete queries_["sort"];

  var { query, date_to, date_from, option_title, product_title } =
    getQuery(context);

  if (option_title) {
    queries_["options.name"] = query["subOrders.productOption"];
  }
  if (product_title) {
    queries_["name"] = query["subOrders.product"];
  }

  let products = await productmodel
    .find({ ...queries_ }, undefined, {
      skip: page === 1 ? 0 : (page - 1) * 10,
      limit: 10,
    })
    .sort(
      !sort
        ? {
            createdAt: -1,
          }
        : [[sort, -1]]
    )
    .lean()
    .exec();

  var orderStats = await Order.aggregate([
    // Unwind subOrders array
    {
      $unwind: "$subOrders",
    },
    // Match subOrders with status "completed"
    {
      $match: {
        "subOrders.status": "completed" && "complete",
        ...query,
      },
    },
    // Group to sum totalPrice across all orders
    {
      $group: {
        _id: null,
        totalTotalPrice: { $sum: "$totalPrice" },
        totalProductQuantity: { $sum: "$subOrders.productQuantity" },
      },
    },
    // Optionally, project to reshape the output
    {
      $project: {
        _id: 0,
        totalPrice: "$totalTotalPrice",
        productQuantity: "$totalProductQuantity",
      },
    },
  ]);
  let array = [];
  for (var product of products) {
    product.totalSold = await Order.aggregate([
      // Unwind subOrders array
      {
        $unwind: "$subOrders",
      },
      // Match subOrders with status "completed"
      {
        $match: {
          "subOrders.product": product._id,
          "subOrders.status": "completed" && "complete",
          ...query,
        },
      },
      // Group to sum totalPrice across all orders
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$subOrders.stockLines" },
          totalSoldPrice: { $sum: "$totalPrice" },
        },
      },
      // Optionally, project to reshape the output
      {
        $project: {
          _id: 0,
          totalSold: "$totalSold",
          totalSoldPrice: "$totalSoldPrice",
        },
      },
    ]);

    const result = await Order.aggregate([
      {
        $unwind: "$subOrders", // Split the products array into separate documents
      },
      {
        $match: {
          "subOrders.product": product._id,
          "subOrders.status": "completed" && "complete",
          ...query,
        },
      },
      {
        $group: {
          _id: product._id, // Group by product ID
          totalSold: { $sum: "$subOrders.stockLines" }, // Sum the quantity sold for each product
          product: { $first: "$subOrders" }, // Get the product name
        },
      },
      {
        $sort: { totalSold: -1 }, // Sort by totalSold in descending order
      },
      {
        $limit: 5, // Limit to the top 10 products
      },
    ]);
    array.push(result[0]);

    try {
      product.totalSoldPrice = product.totalSold[0].totalSoldPrice;

      product.totalSold = product.totalSold[0].totalSold;
    } catch (e) {}
  }

  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
      page,
      pages: Math.ceil(prodcount / 10),
      count: prodcount,
      ...queries,
      date_to: date_to ? date_to : null,
      date_from: date_from ? date_from : null,
      stats:
        orderStats.length > 0
          ? orderStats[0]
          : { totalPrice: 0, productQuantity: 0 },
      option_title,
      product_title,
    },
  };
};
export default OrderPage;
