import React, { createRef } from "react";
import { ObjectId } from "bson";
import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import OrdersGrid from "@components/admin/OrdersGrid";
import Alert from "@components/Alert";
import { Meta } from "@components/templates/Meta";
import getTopUpOrderModel from "@models/topuporder";
import moment from "moment";
import { useRouter } from "next/router";
import getUserModel from "@models/user";
import { CheckCircle, DotsThree, Note, X } from "phosphor-react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import Notes from "@components/admin/Notes";
import Swal from "sweetalert2";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { currency } from "@root/currency";

const RenderStatus = ({ status }: any) => {
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
  topups,
  topupSpenders,
  page,
  count,
  pages,
  status,
  sort,
  gateway,
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
  const [gateway_, setGateway] = React.useState<string>();
  const [notesUser, setNotesUser] = React.useState();
  const [notesOpen, setNotesOpen] = React.useState<boolean>();

  const router = useRouter();
  const to = page * 10 + 10;

  const markAsPaid = (id: string) => {
    var req = axios.post(`/api/admin/top_up/${id}/mark_as_paid`);
    setDropdown(null);

    req
      .then((t) => {
        router.replace(router.asPath);
        Swal.fire({
          title: "Top up order marked as paid",
          text: "Action successful",
          icon: "success",
        });
      })
      .catch((err) => {
        Swal.fire({
          title: "Could not process request",
          text: "Action failed",
          icon: "error",
        });
      });
  };
  const leaveNotes = (id: string) => {
    return new Promise((resolveFinal, rejectFinal) => {
      var req = axios.post(`/api/admin/top_up/${id}/notes`, { notes });

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
    if (gateway_) {
      query.gateway = gateway_;
    }
    router.query = query;
    router.push(router);
  }, [page_, status_, gateway_, sort_, search_, user_]);

  return (
    <AdminNavProvider session={session}>
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
        <h1 className={"text-2xl mt-2.5 font-bold"}>Top Ups</h1>
        <div
          className={
            " mt-6   text-sm border-gray-600 flex flex-wrap justify-between items-end gap-7 py-4"
          }
        >
          <div
            className={
              " text-sm border-gray-600 flex flex-wrap items-center gap-7"
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
                <option value={"createdAt"}>Date created</option>
                <option value={"paid_at"}>Date paid</option>
                <option value={"amount"}>Amount</option>
              </select>
            </div>
            <div>
              <div className={"flex items-center gap-2"}>
                <div className={"text-white"}>Status</div>
                {status_ && (
                  <X
                    onClick={() => {
                      setStatus("");
                    }}
                    size={16}
                    color={"white"}
                  />
                )}
              </div>
              <select
                value={status_}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
                className={
                  "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
                }
              >
                <option value={""}>All</option>

                <option value={"paid"}>Credited</option>
                <option value={"pending"}>Pending</option>
              </select>
            </div>
            <div className={" max-lg:pr-4"}>
              <div className={"flex items-center gap-2"}>
                <div className={"text-white"}>User</div>
                {user_ && (
                  <X
                    onClick={() => {
                      setUser("");
                    }}
                    size={16}
                    color={"white"}
                  />
                )}
              </div>
              <select
                value={user_}
                onChange={(e) => {
                  setUser(e.target.value);
                }}
                className={
                  "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] max-lg:!w-[90%] text-white"
                }
              >
                <option value={""}>All</option>
                {users.map((x: any) => (
                  <option value={x.value}>{x.label}</option>
                ))}
              </select>
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
                placeholder={"Search by address, transaction id....."}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              ></input>
            </div>
          </div>
        </div>
        <div
          className={
            " bg-[#1F2421] border border-[#303633] w-full rounded-md px-0 py-2 mt-4"
          }
        >
          <div className={"overflow-x-auto"}>
            <Table className={"w-full text-left"}>
              <Thead>
                <Tr className={"border-b border-[#404242]"}>
                  <Th className={"p-2 pl-5 box-border"}>ID</Th>

                  <Th>User</Th>
                  <Th>
                    <select
                      value={gateway_ || "Payment gateway"}
                      onChange={(e) => {
                        setGateway(e.target.value);
                      }}
                      className={
                        " outline-none focus:ring-0 bg-[#1F2421] text-start rounded-[4px]  min-w-[130px] text-white"
                      }
                    >
                      <option value={""}>All Gateway</option>
                      {currency.map((data) => (
                        <option value={data.value}>{data.coin}</option>
                      ))}
                    </select>
                    {/* <p className="whitespace-nowrap"></p> */}
                  </Th>
                  <Th>Amount</Th>
                  <Th>
                    <p className="px-2">Status</p>
                  </Th>
                  <Th>
                    <p className="whitespace-nowrap">Cashapp Note</p>
                  </Th>
                  <Th>
                    <p className="whitespace-nowrap px-2">Crypto Address</p>
                  </Th>

                  <Th>
                    <p className="whitespace-nowrap">Date created</p>
                  </Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {topups.length === 0 ? (
                  <Tr>
                    <Td>
                      <p className="py-3 px-5">No records found</p>
                    </Td>
                  </Tr>
                ) : (
                  <>
                    {topups.map((topup: any) => (
                      <Tr
                        className={
                          "border-b text-sm border-[#404242] last:border-none"
                        }
                      >
                        <Td className={"p-2 pl-5 whitespace-nowrap box-border"}>
                          {topup.uniqid}
                        </Td>
                        <Td>{topup.user.email}</Td>
                        <Td className={"capitalize"}>
                          {topup.sellix
                            ? topup.sellix.gateway
                              ? topup.sellix.gateway.toLowerCase()
                              : "Not chosen"
                            : "Not chosen"}
                        </Td>

                        <Td>
                          <div className={"flex items-center gap-3"}>
                            ${topup.amount.toFixed(2)}
                          </div>
                        </Td>
                        <Td>
                          <p className="px-2">
                            <RenderStatus status={topup.status} />
                          </p>
                        </Td>
                        <Td>
                          {topup.sellix && topup.sellix.cashapp_note
                            ? topup.sellix.cashapp_note
                            : "None"}
                        </Td>
                        <Td>
                          <p className="px-2">
                            {topup.sellix && topup.sellix.crypto_address
                              ? topup.sellix.crypto_address
                              : "None"}
                          </p>
                        </Td>
                        <Td>{moment(topup.createdAt).format("lll")}</Td>
                        <Td className={"relative"}>
                          <div
                            className={
                              "flex items-center text-left justify-left gap-3"
                            }
                          >
                            <Note
                              style={{
                                opacity: topup.notes ? 1 : 0,
                                pointerEvents: (!topup.notes && "none") as any,
                              }}
                              className={"hover:cursor-pointer"}
                              onClick={() => {
                                setDropdown(null);
                                setNotesOpen(true);
                                setNotes(topup.notes);
                                setNotesUser(topup._id);
                              }}
                              size={24}
                              weight={"bold"}
                            />
                            <DotsThree
                              className={"mr-auto hover:cursor-pointer"}
                              onClick={() =>
                                setDropdown((e) =>
                                  e === topup._id ? null : topup._id
                                )
                              }
                              size={24}
                              weight={"bold"}
                            />
                            {dropdown === topup._id && (
                              <div
                                className={
                                  "absolute top-[35px] z-[1] w-[200px] bg-[#0C0F16] py-1 pl-4 pb-3 right-[23px]  border border-[#141821] shadow-xl text-white rounded-md text-center"
                                }
                              >
                                {topups.find((x: any) => x._id === dropdown)
                                  .status === "pending" && (
                                  <div
                                    onClick={() => {
                                      setDropdown(null);
                                      Swal.fire({
                                        title:
                                          "Are you sure you want to mark this order as paid?",
                                        text: "This action cannot be cancelled once you submit",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonColor: "#d33",
                                        cancelButtonColor: "#3085d6",
                                      }).then((r) => {
                                        if (r.isConfirmed) {
                                          markAsPaid(topup._id);
                                        }
                                      });
                                    }}
                                    className={
                                      "w-full text-white text-center mt-2 flex items-center gap-2 hover:cursor-pointer"
                                    }
                                  >
                                    <CheckCircle size={20} /> Mark as paid
                                  </div>
                                )}
                                <div
                                  onClick={() => {
                                    setDropdown(null);
                                    setNotesOpen(true);
                                    setNotes(topup.notes);
                                    setNotesUser(topup._id);
                                  }}
                                  className={
                                    "w-full text-white text-center mt-2 flex items-center gap-2  hover:cursor-pointer"
                                  }
                                >
                                  <Note size={20} /> Leave a note
                                </div>
                              </div>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </>
                )}
              </Tbody>
            </Table>
          </div>

          {topups.length === 0 && (
            <div className={"text-gray-300 ml-5 my-3 text-sm"}>
              No records found
            </div>
          )}
          {topups.length > 0 && (
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
      <div className={"mt-8"}>
        <h1 className={"text-2xl mt-2.5 font-bold"}>Top Spenders</h1>
        <div
          className={
            " bg-[#1F2421] border border-[#303633] w-full rounded-md px-0 py-2 mt-4"
          }
        >
          <table className={"w-full text-left"}>
            <thead>
              <tr className={"border-b border-[#404242]"}>
                <th className={"p-2 pl-5 box-border"}>User</th>
                <th>Amount spent</th>
              </tr>
            </thead>
            <tbody>
              {topupSpenders.map((topup: any) => (
                <tr
                  className={
                    "border-b text-sm border-[#404242] last:border-none"
                  }
                >
                  <td className={"p-2 pl-5 "}>{topup.user.email}</td>

                  <td className={"box-border"}>
                    ${topup.totalAmountSpent.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

const getQueries = (query: any) => {
  let { status, sort, search, user, gateway } = query;
  var queries: any = {};
  if (["paid", "pending"].includes(status)) {
    queries["status"] = status;
  }
  if (["createdAt", "paid_at", "amount"].includes(sort)) {
    queries["sort"] = sort;
  }
  if (search) {
    queries["$or"] = [
      { "sellix.crypto_address": { $regex: search, $options: "i" } },
      { uniqid: { $regex: search, $options: "i" } },
    ];
  }
  if (user) {
    queries.user = user;
  }
  if (gateway) {
    queries["sellix.gateway"] = gateway;
  }

  return queries;
};

const getTopSpenders = async (
  topupmodel: any
): Promise<{
  totalAmountSpent: number;
  user: { _id: string; email: string };
}> => {
  let topSpenders = await topupmodel.aggregate([
    {
      $match: { status: "paid" },
    },
    {
      $group: {
        _id: "$user",
        totalAmountSpent: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "users", // replace with the actual name of your users collection
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $project: {
        _id: 0,
        user: "$_id",
        totalAmountSpent: 1,
        userDetails: { $arrayElemAt: ["$userDetails", 0] },
      },
    },
    {
      $limit: 10,
    },
  ]);
  return topSpenders.map((x: any) => {
    return {
      totalAmountSpent: x.totalAmountSpent,
      user: { email: x.userDetails.email, _id: x.userDetails._id },
    };
  });
};
export const getServerSideProps = async (context: any) => {
  let userModel = await getUserModel();
  let users = await userModel.find();
  let page = await getPage(context.query);
  let queries: any = await getQueries(context.query);
  // let [queries, filterValues] = (await getQueries(context.query)) as any;
  let topupmodel = await getTopUpOrderModel();

  let topupcount = await topupmodel.count({ ...queries });
  let topups = await topupmodel
    .find({ ...queries }, undefined, {
      skip: page === 1 ? 0 : (page - 1) * 10,
      limit: 10,
    })
    .populate("user")
    .sort(
      queries.sort
        ? {
            createdAt: -1,
          }
        : [[queries.sort, -1]]
    );


  let topupSpenders = await getTopSpenders(topupmodel);
  return {
    props: {
      topups: JSON.parse(JSON.stringify(topups)),
      page,
      pages: Math.ceil(topupcount / 10),
      count: topupcount,
      ...queries,
      users: JSON.parse(
        JSON.stringify(
          users.map((x) => {
            return {
              label: x.email,
              value: x._id,
            };
          })
        )
      ),
      topupSpenders: JSON.parse(JSON.stringify(topupSpenders || [])),
    },
  };
};
export default OrderPage;
