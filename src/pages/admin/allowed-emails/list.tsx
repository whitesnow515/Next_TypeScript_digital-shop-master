import React, { createRef } from "react";

import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import OrdersGrid from "@components/admin/OrdersGrid";
import Alert from "@components/Alert";
import { Meta } from "@components/templates/Meta";
import getTopUpOrderModel from "@models/topuporder";
import moment from "moment";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useRouter } from "next/router";
import getUserModel from "@models/user";
import { CheckCircle, DotsThree, Note, Trash, X } from "phosphor-react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import Notes from "@components/admin/Notes";
import getProductModel from "@models/product";
import getOrderModel from "@models/order";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import FormButton from "@components/FormButton";
import Swal from "sweetalert2";
import getAllowedEmailsModel from "@models/allowed-emails";
import Modal from "@components/admin/Modal";
import { error as errorLog } from "@util/log";
import Field from "@components/Field";

const AddModal = (props: {
  emailRef: React.RefObject<HTMLInputElement>;
  reasonRef: React.RefObject<HTMLInputElement>;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const router = useRouter();
  return (
    <Modal
      id={"add-modal"}
      title={"Allow Email"}
      description={"Enter email address to allow"}
      buttons={
        <>
          <FormButton
            type={"button"}
            color={"green"}
            fullWidth={false}
            className={"mx-4"}
            onClickLoading={() => {
              // POST /api/flagged/add {email, reason}
              return axios
                .post("/api/email/validity/exempt/add/", {
                  email: props.emailRef.current?.value,
                })
                .then((res) => {
                  router.push(router.asPath);
                })
                .catch((eX) => {
                  errorLog(eX);
                  props.setError(
                    eX?.response?.data?.message || "Something went wrong"
                  );
                })
                .finally(() => {
                  document.getElementById("add-modal")?.classList.add("hidden");
                });
            }}
          >
            Save
          </FormButton>
          <FormButton
            type={"button"}
            color={"red"}
            fullWidth={false}
            onClick={() => {
              document.getElementById("add-modal")?.classList.add("hidden");
            }}
          >
            Cancel
          </FormButton>
        </>
      }
    >
      {" "}
      <Field
        id={"enter-email-field"}
        name={"email"}
        required
        placeholder={"john.doe@example.com"}
        type={"email"}
        className={"pt-2"}
        refPassThrough={props.emailRef}
      />
    </Modal>
  );
};
const OrderPage = ({ users, page, count, pages, email_, username_ }: any) => {
  const session = useSession();
  const [page_, setPage] = React.useState(page);
  const [email, setEmail] = React.useState(email_);
  const [username, setUsername] = React.useState(username_);
  const [error, setError] = React.useState<string>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const reasonRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const to = page * 10 + 10;

  React.useEffect(() => {
    var query: any = {};
    if (page_ > 1) {
      query.page = page_;
    }

    if (username) {
      query.username = username;
    }
    if (email) {
      query.email = email;
    }
    router.query = query;
    router.push(router);
  }, [page_, username, email]);

  return (
    <AdminNavProvider session={session}>
      <Toaster />
      <AddModal emailRef={emailRef} reasonRef={reasonRef} setError={setError} />

      <Meta
        title={`Allowed Emails`}
        description={"Admin allowed emails page"}
      />
      <div>
        <div className={"flex justify-between items-center"}>
          <h1 className={"text-2xl mt-2.5 font-bold"}>Allowed Emails</h1>

          <FormButton
            onClick={() => {
              document.getElementById("add-modal")?.classList.remove("hidden");
            }}
            className={"mt-4 w-max"}
          >
            Add
          </FormButton>
        </div>
        <div
          className={
            "border mt-6 text-sm border-gray-600 flex items-center gap-7 p-2 px-4 py-4"
          }
        >
          <div>
            <div className={"flex items-center gap-2"}>
              <div className={"text-white"}>Email</div>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={
                "bg-[#303633] mt-1.5 px-2 py-1 rounded-[4px]  min-w-[130px] text-white"
              }
            />
          </div>
        </div>
        <div
          className={" bg-[#1F2421] border border-[#303633] w-full rounded-md px-0 py-2 mt-4"}
        >
          <Table className={"w-full text-left"}>
            <Thead>
              <Tr className={"border-b border-[#404242]"}>
                <Th className={"p-2 pl-5 box-border"}>ID</Th>

                <Th>Email</Th>
                <Th>Added By</Th>

                <Th>Added At</Th>

                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((prod: any) => (
                <Tr
                  onClick={() => router.push(`/admin/products/${prod._id}`)}
                  className={
                    "hover:cursor-pointer hover:bg-[#303633] border-b text-sm border-[#404242] last:border-none"
                  }
                >
                  <Td className={"p-2 pl-5 box-border"}>{prod._id}</Td>
                  <Td>{prod.email}</Td>

                  <Td>{prod.addedByName}</Td>

                  <Td>{moment(prod.addedAt).format("lll")}</Td>

                  <Td className={"relative py-1"}>
                    <div
                      className={"bg-red-600  w-max px-3 py-2  rounded-lg mx-2"}
                      color={"red"}
                      onClick={() => {
                        Swal.fire({
                          title: "Are you sure?",
                          text: "This cannot be undone",
                          icon: "warning",
                          showCancelButton: true,
                        }).then((res) => {
                          if (res.isConfirmed) {
                            axios
                              .post("/api/email/validity/exempt/delete/", {
                                id: prod._id,
                              })
                              .then(() => {
                                router.push(router.asPath);
                              })
                              .catch((err) => {
                                Swal.fire({
                                  title: "Error",
                                  text:
                                    err?.response?.data?.message ||
                                    "Something went wrong",
                                  icon: "error",
                                });
                              });
                          }
                        });
                      }}
                    >
                      Delete
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {users.length === 0 && (
            <div className={"text-gray-300 ml-5 my-3 text-sm"}>
              No records found
            </div>
          )}
          {users.length > 0 && (
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
  let { username, email } = query;
  var queries: any = {};

  if (email) {
    queries["email"] = { $regex: email, $options: "i" };
  }

  return queries;
};

export const getServerSideProps = async (context: any) => {
  let page = await getPage(context.query);
  let queries = await getQueries(context.query);
  let allowedModel = await getAllowedEmailsModel();

  let allowedcount = await allowedModel.count({ ...queries });
  let queries_ = queries;
  let sort = queries.sort;

  let users = await allowedModel
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

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)),
      page,
      pages: Math.ceil(allowedcount / 10),
      count: allowedcount,
      email: context.query.email ? context.query.email : null,
      username: context.query.username ? context.query.username : null,

      ...queries,
    },
  };
};
export default OrderPage;
