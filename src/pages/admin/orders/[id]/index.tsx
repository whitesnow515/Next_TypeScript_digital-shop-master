import React, { useEffect, useState } from "react";

import {
  Grid,
  LinearProgress,
  Modal as MuiModal,
  Stack,
  TextField,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import Swal from "sweetalert2";

import { SubOrderInterface } from "@app-types/models/order";
import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import OrderInfo from "@components/OrderInfo";
import { Meta } from "@components/templates/Meta";
import getFlaggedEmailModel from "@models/flaggedemails";
import { resolveOrder } from "@models/order";
import getProductModel from "@models/product";
import { getReason, ReactSwal } from "@util/ClientUtils";
import { debug, error as errorLog } from "@util/log";
import { useRerenderHelper } from "@util/ReRenderHelper";
import { Pen, Plus } from "phosphor-react";
import Link from "next/link";
import { useRouter } from "next/router";
import Modal from "@components/admin/Modal";
import { CircleSpinner } from "react-spinners-kit";
import OrderStatus from "@components/OrderStatus";

const RenderStatus = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <span className=" text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-green-900 text-green-300">
        Completed
      </span>
    );
  }
  if (status === "awaiting-verification") {
    return (
      <span className="text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-blue-900 text-blue-300">
        Awaiting verification
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-blue-900 text-blue-300">
        Refunded
      </span>
    );
  }
  return (
    <span className="text-xs font-medium me-2 px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
      Pending
    </span>
  );
};

const PullstockModal = (props: any) => {
  const [data, setData] = useState([]);
  const [finalStock, setFinalStock] = useState("");
  const [amount, setAmount] = useState(
    (props.orderDetails && props.orderDetails.orderStock) || 1
  );
  const [reason, setReason] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const snackbar = useSnackbar();
  const [confirmation, setConfirmation] = useState(false);

  const getStock = (
    orderId: string,
    productId: string,
    optionId: string,
    amount: number,
    subOrderId: string
  ) => {
    setLoading(true);
    axios
      .post(`/api/stock/upload/pullstock`, {
        orderId,
        productId,
        optionId,
        amount,
        subOrderId,
      })
      .then((res) => {
        setData((prevState) =>
          prevState ? [...prevState, ...res.data.data] : res.data.data
        );
        setLoading(false);
        setFinalStock((prevState) =>
          prevState
            ? `${prevState}\n${res.data.data.join("\n")}`
            : res.data.data.join("\n")
        );
      })
      .catch((err) => {
        setLoading(false);
        snackbar.enqueueSnackbar(err?.response?.data?.message, {
          variant: "error",
        });
      });
  };

  const handleTextareaChange = (e: any) => {
    setFinalStock(e.target.value);

    // Split the text into an array of lines
    const updatedData = e.target.value.split("\n");
    setData(updatedData);
  };

  return (
    <Modal
      id={props.id}
      title={"Pull Stock"}
      description={""}
      buttons={
        <div className="flex items-center gap-2">
          <div>
            <button
              className={
                "bg-[#303633] delay-100 transition text-sm text-center py-[7.5px] px-2 hover:bg-[#4A524E] rounded-md font-bold"
              }
              onClick={() => {
                setData([]);
                setConfirmation(false);
                document.getElementById(props.id)?.classList.add("hidden");
              }}
            >
              Cancel
            </button>
          </div>
          {confirmation ? (
            <>
              <button
                className={
                  "bg-[#303633] delay-100 transition text-sm text-center py-[7.5px] px-4 hover:bg-[#4A524E] rounded-md font-bold"
                }
                onClick={() => setConfirmation(false)}
              >
                Back
              </button>
              <div>
                <FormButton
                  disabled={reason === ""}
                  onClick={() => {
                    if (reason === "") {
                      snackbar.enqueueSnackbar("Reason is required", {
                        variant: "error",
                      });
                      return;
                    }
                    axios
                      .post(
                        `/api/stock/upload/replacement?pull=true&amount=${amount}`,
                        {
                          orderId: props.orderDetails.orderId,
                          reason,
                          data,
                          subOrderId: props.orderDetails.subOrderId,
                        }
                      )
                      .then((res) => {
                        if (res.data.success) {
                          snackbar.enqueueSnackbar(res.data.message, {
                            variant: "success",
                          });
                          router.replace(router.asPath);
                          // window.location.href = `/admin/orders/${order._id}/?info=${res.data.message}`;
                        }
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        snackbar.enqueueSnackbar(eX.response?.data?.message, {
                          variant: "error",
                        });
                        // Swal.fire({
                        //   title: "Error",
                        //   text:
                        //     eX.response?.data?.message || "An error occurred.",
                        //   icon: "error",
                        // });
                      });
                  }}
                >
                  Confirm
                </FormButton>
              </div>
            </>
          ) : (
            <>
              <div>
                <FormButton
                  className="bg-[#303633] scale-100 delay-100 transition text-sm text-center py-[7px] hover:bg-[#4A524E] w-[49%] font-bold rounded-full"
                  disabled={amount === "0"}
                  onClick={() => {
                    if (amount === "0") {
                      snackbar.enqueueSnackbar(
                        "Amount must be greater than 0",
                        {
                          variant: "error",
                        }
                      );
                      return;
                    }
                    getStock(
                      props.orderDetails.orderId,
                      props.orderDetails.productId,
                      props.orderDetails.optionId,
                      amount,
                      props.orderDetails.subOrderId
                    );
                  }}
                >
                  {data?.length === 0 ? "Pull Stock" : "Pull More"}
                </FormButton>
              </div>
              <div>
                <FormButton
                  className="text-sm text-center py-2 px-3 font-bold rounded-md"
                  disabled={amount === "0"}
                  onClick={() => {
                    router.push(
                      `/admin/orders/${props.orderDetails.orderId}/replacement/${props.orderDetails.subOrderId}`
                    );
                  }}
                >
                  Upload Replacement Stock
                </FormButton>
              </div>
              {data?.length > 0 && (
                <div>
                  <FormButton
                    disabled={amount === 0}
                    onClick={() => {
                      if (data.length !== props.orderDetails.orderStock) {
                        snackbar.enqueueSnackbar(
                          "Stock must be equal to the amount that user bought",
                          {
                            variant: "error",
                          }
                        );
                        return;
                      } else {
                        setConfirmation(true);
                      }
                    }}
                  >
                    Grant Replacement
                  </FormButton>
                </div>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-2 mt-4">
        {confirmation ? (
          <>
            <div className="flex flex-col gap-1">
              <label>Reason</label>
              <input
                placeholder="Enter reason"
                onChange={(e) => setReason(e.target.value)}
                className="w-[500px] text-white p-2 border bg-transparent"
                type="text"
              />
            </div>
          </>
        ) : (
          <>
            {data?.length > 0 && (
              <>
                {!loading ? (
                  <div className="flex flex-col gap-1">
                    <label>Stock</label>
                    <textarea
                      defaultValue={finalStock}
                      onChange={handleTextareaChange}
                      style={{ resize: "none" }}
                      className="p-2 text-gray-400 outline-none focus:ring-0 text-sm bg-[#1F2421] w-[100%]"
                      rows={6}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center gap-2 items-center">
                    <CircleSpinner size={25} /> <span>Pulling...</span>
                  </div>
                )}
              </>
            )}
            <div className="flex flex-col gap-1">
              <label>Amount</label>
              <input
                value={amount}
                min={0}
                className="w-[100%] text-white p-2 border bg-transparent"
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
const OrderAdminPage = ({
  order,
  orderData,
  infoAlert,
  errorAlert,
  flagged,
  product,
}: InferGetServerSidePropsType<typeof getServerSideProps> | any) => {
  const session: any = useSession();
  const snackbar = useSnackbar();
  const rerender = useRerenderHelper();
  const [inf, setInfo] = useState<string>(infoAlert as string);
  const [err, setError] = useState<string>(errorAlert as string);
  const [stock, setStock] = useState<string>(errorAlert as string);
  const [orderDetails, setOrderDetails] = useState<any>();
  const [note, setNote] = useState<string>(order.notes || "");

  const router = useRouter();
  const [showUnsafeStatuses, setShowUnsafeStatuses] = useState<boolean>(false);

  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  //
  // useEffect(() => {
  //   const newStocks = [];
  //   for (const stockId of orderData?.stocks || []) {
  //     newStocks.push(stockId);
  //   }
  //   setStocks(newStocks);
  // }, [orderData]);

  const UpdateHistoryModal = ({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: (open: boolean) => void;
  }) => {
    const columns: GridColDef[] = [
      {
        field: "timestamp",
        headerName: "Date",
        width: 200,
        renderCell: (params) =>
          new Date(params.value as string).toLocaleString(),
      },
      {
        field: "data.type",
        headerName: "Type",
        width: 200,
        renderCell: (params) => params.row.data.type,
      },
      {
        field: "performerDisplayName",
        headerName: "Performer",
        width: 150,
        renderCell: (params) => {
          if (params.row.performerId) {
            return (
              <a
                href={`/admin/users/${params.row.performerId}`}
                className={"text-white"}
              >
                {params.row.performerDisplayName}
              </a>
            );
          }
          return <span>{params.row.performerDisplayName}</span>;
        },
      },
      {
        field: "data.ip",
        headerName: "IP Address",
        width: 150,
        renderCell: (params) => params.row.ip,
      },
      {
        field: "data.reason",
        headerName: "Reason",
        width: 200,
        renderCell: (params) => params.row.data.reason,
      },
      {
        field: "actions",
        headerName: "Actions",
        type: "actions",
        width: 300,
        renderCell: (params) => {
          return (
            <div className="flex justify-start items-start">
              <div>
                <FormButton
                  fullWidth={false}
                  onClick={() => {
                    Swal.fire({
                      title: "Data",
                      // show a table of data
                      html: `<pre>${JSON.stringify(
                        params.row.data,
                        null,
                        2
                      )}</pre>`,
                    });
                  }}
                >
                  View Data
                </FormButton>
              </div>
              {params.row.data.type === "add_replacement" && (
                <div>
                  <FormButton
                    fullWidth={false}
                    className={"ml-2"}
                    href={`/stock/${params.row.data?.replacementId}`}
                  >
                    View Replacement
                  </FormButton>
                </div>
              )}
            </div>
          );
        },
      },
    ];
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [maxSize, setMaxSize] = useState(0);
    const [data, setData] = useState<any[]>([]);

    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      axios
        .get(`/api/admin/audit/`, {
          params: {
            page,
            limit,
            type: "order",
            extraQuery: JSON.stringify({
              "data.orderId": order._id,
            }),
          },
        })
        .then((res) => {
          debug(res);
          setData(res.data.data);
          setMaxSize(res.data.size || 0);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [page, limit, open]);

    return (
      <>
        <MuiModal
          open={open}
          onClose={() => setOpen(!open)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          style={{
            zIndex: 1059,
          }}
        >
          <div
            style={{
              height: "75vh",
              width: "75%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
            }}
            className={"bg-gray-800"}
          >
            <DataGridPro
              rows={data}
              columns={columns}
              rowCount={maxSize}
              getRowId={(d) => {
                return d._id;
              }}
              loading={loading}
              slots={{
                loadingOverlay: LinearProgress,
              }}
              pageSizeOptions={[5, 10, 15, 20, 25, 30, 50, 100]}
              disableRowSelectionOnClick
              paginationMode={"server"}
              pagination
              paginationModel={{
                page,
                pageSize: limit,
              }}
              onPaginationModelChange={(change) => {
                setLimit(change.pageSize);
                setPage(change.page);
              }}
              disableColumnFilter
            />
            <FormButton className={"mt-4"} onClick={() => setOpen(!open)}>
              Close
            </FormButton>
          </div>
        </MuiModal>
      </>
    );
  };

  return (
    <>
      <Meta
        title={`Admin Order`}
        description={`Order page for order: ${order._id}`}
      />
      <AdminNavProvider session={session}>
        {inf && (
          <Alert type={"info"} dismissible>
            {inf}
          </Alert>
        )}
        {err && (
          <Alert type={"error"} dismissible>
            {err}
          </Alert>
        )}
        {flagged && (
          <Alert
            type={"error"}
            button={
              <>
                <FormButton href={`/admin/flagged/${flagged}`}>
                  View Details
                </FormButton>
              </>
            }
          >
            This email is flagged!
          </Alert>
        )}

        <div className="text-xl">
          <p className="font-bold text-3xl">
            Order · <span className={"text-xl"}>{order._id}</span>
          </p>
        </div>
        <Grid container gap={2}>
          <Grid item lg={12}>
            <Card>
              <div>
                <OrderInfo order={order} orderData={orderData} admin={true} />
              </div>
            </Card>
          </Grid>
          <PullstockModal id={"stock-modal"} orderDetails={orderDetails} />
          <Grid
            item
            container
            className="xl:flex-nowrap"
            xs={12}
            gap={2}
            md={12}
          >
            <Grid item xs={12} xl={6}>
              <Card className="h-[100%]">
                <div>
                  <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                    Order Notes
                  </h1>
                  <div className="flex flex-col items-center pt-3">
                    <TextField
                      id="note"
                      label="Note"
                      variant="outlined"
                      multiline
                      rows={5}
                      value={note || ""}
                      sx={{
                        width: "100%",
                      }}
                      onChange={(e) => {
                        setNote(e.target.value);
                      }}
                    />
                    <FormButton
                      className={"mt-4"}
                      onClickLoading={() =>
                        axios
                          .post("/api/orders/update/note/", {
                            id: order._id,
                            note,
                          })
                          .then((res) => {
                            if (res.data.success) {
                              window.location.href = `/admin/orders/${order._id}?info=${res.data.message}`;
                            } else {
                              setError(res.data.message);
                            }
                          })
                          .catch((eX) => {
                            if (eX.response) {
                              setError(eX.response.data.message);
                            } else {
                              setError(eX.message);
                            }
                          })
                      }
                    >
                      Save
                    </FormButton>
                  </div>
                </div>
              </Card>
            </Grid>
            <Grid className="flex flex-col gap-2" item xs={12} xl={6}>
              {/* <Card>
                <div>
                  <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                    Actions
                  </h1>
                  <Grid
                    container
                    spacing={2}
                    // center
                    className={"pt-2 flex flex-row justify-center"}
                  >
                    {order.status === "pending" && (
                      <>
                        <Grid item xs={6}>
                          <FormButton
                            onClickLoading={() => {
                              return getReason((reason) => {
                                return axios
                                  .post("/api/orders/update/paid/", {
                                    id: order._id,
                                    reason,
                                  })
                                  .then((res) => {
                                    if (res.data.success) {
                                      window.location.href = `/admin/orders/${order._id}?info=${res.data.message}`;
                                    } else {
                                      setError(res.data.message);
                                    }
                                  })
                                  .catch((eX) => {
                                    if (eX.response) {
                                      setError(eX.response.data.message);
                                    } else {
                                      setError(eX.message);
                                    }
                                  });
                              }, true);
                            }}
                          >
                            Mark as Paid
                          </FormButton>
                        </Grid>
                        {order.paymentMethod === "CashApp" && (
                          <Grid item xs={6}>
                            <FormButton
                              onClick={() => {
                                // Ask user for link to cashapp receipt
                                Swal.fire({
                                  title: "Receipt URL",
                                  html: `<span>Please enter the URL to your CashApp receipt.</span><a class="text-white" href="
https://www.youtube.com/watch?v=L80p5W_3HJQ">(video)</a>`,
                                  icon: "info",
                                  showCancelButton: true,
                                  confirmButtonText: "Submit",
                                  cancelButtonText: "Cancel",
                                  input: "url",
                                  inputLabel: "URL",
                                  inputPlaceholder:
                                    "https://cash.app/payments/...",
                                  inputValue: "",
                                  preConfirm(inputValue: any) {
                                    // check if url is valid and is cash.app/payments
                                    if (
                                      !inputValue
                                        .toLowerCase()
                                        .trim()
                                        .startsWith(
                                          "https://cash.app/payments/"
                                        )
                                    ) {
                                      Swal.showValidationMessage(
                                        `Please enter a valid CashApp receipt URL!`
                                      );
                                    }
                                  },
                                }).then((value) => {
                                  if (value.isConfirmed) {
                                    const valueData =
                                      value.value as unknown as string;
                                    const url = new URL(valueData);
                                    const cashappId =
                                      url.pathname.split("/")[2];
                                    debug({
                                      cashappId,
                                      valueData,
                                    });
                                    Swal.fire({
                                      title: "Please wait...",
                                      html: "Retrieving Receipt...",
                                      allowOutsideClick: false,
                                      didOpen: () => {
                                        Swal.showLoading();
                                      },
                                    });
                                    axios
                                      .post(
                                        `/api/checkout/check/${order._id}/receipt/?cashAppId=${cashappId}`
                                      )
                                      .then((res) => {
                                        if (res.data.finished) {
                                          window.location.href =
                                            res.data.redirectUrl ||
                                            "/pay/success/";
                                        } else {
                                          const msg =
                                            res.data.message ||
                                            "Payment not found, please try again later!";
                                          Swal.fire({
                                            title: "Error",
                                            text: msg,
                                            icon: "error",
                                          });
                                        }
                                      })
                                      .catch((eX) => {
                                        Swal.fire({
                                          title: "Error",
                                          text:
                                            eX?.response?.data?.message ||
                                            "An error occurred! Please try again later!",
                                          icon: "error",
                                        });
                                      });
                                  }
                                });
                              }}
                            >
                              Check Receipt
                            </FormButton>
                          </Grid>
                        )}
                      </>
                    )}
                    {(order.status === "awaiting-verification" ||
                      (order.status === "cancelled" &&
                        order.metadata?.denied === true)) && (
                      <>
                        <Grid item xs={4}>
                          <FormButton
                            onClickLoading={(e) => {
                              e.stopPropagation();
                              // POST /api/orders/queue/approve {id: params.row._id}
                              return axios
                                .post("/api/orders/queue/approve/", {
                                  id: order._id,
                                })
                                .then(async (res) => {
                                  if (res.data.success) {
                                    window.location.href = `/admin/orders/${order._id}?info=${res.data.message}`;
                                  } else {
                                    Swal.fire({
                                      title: "Error",
                                      text: res.data.message,
                                      icon: "error",
                                    });
                                  }
                                })
                                .catch((eX) => {
                                  errorLog(err);
                                  Swal.fire({
                                    title: "Error",
                                    text:
                                      eX.response?.data?.message ||
                                      "Failed to approve order",
                                  });
                                });
                            }}
                            color={"green"}
                          >
                            Approve
                          </FormButton>
                        </Grid>
                        {!(
                          order.status === "cancelled" &&
                          order.metadata?.denied === true
                        ) && (
                          <Grid item xs={4}>
                            <FormButton
                              onClickLoading={(e) => {
                                e.stopPropagation();
                                return axios
                                  .post("/api/orders/queue/deny/", {
                                    id: order._id,
                                  })
                                  .then(async (res) => {
                                    if (res.data.success) {
                                      window.location.href = `/admin/orders/${order._id}?info=${res.data.message}`;
                                    } else {
                                      Swal.fire({
                                        title: "Error",
                                        text: res.data.message,
                                        icon: "error",
                                      });
                                    }
                                  })
                                  .catch((eX: any) => {
                                    errorLog(eX);
                                    Swal.fire({
                                      title: "Error",
                                      text:
                                        eX?.response?.data?.message ||
                                        "Failed to deny order",
                                    });
                                  });
                              }}
                              color={"red"}
                            >
                              Deny
                            </FormButton>
                          </Grid>
                        )}
                      </>
                    )}
                    <RequireRole admin>
                      <UpdateHistoryModal
                        open={historyModalOpen}
                        setOpen={setHistoryModalOpen}
                      />
                      <Grid item xs={4}>
                        <FormButton
                          color="primary"
                          toggle={[historyModalOpen, setHistoryModalOpen]}
                        >
                          History
                        </FormButton>
                      </Grid>
                      <Grid item xs={4}>
                        <FormButton
                          color="red"
                          onClickLoading={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            return Swal.fire({
                              title:
                                "Are you sure you want to delete this order?",
                              text: "This action cannot be undone. Associated stock will also be deleted.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                            }).then((r) => {
                              if (r.isConfirmed) {
                                axios
                                  .delete(`/api/orders/delete/${order._id}`)
                                  .then((res) => {
                                    if (res.data.success) {
                                      router.push(
                                        `/admin/orders?info=${res.data.message}`
                                      );
                                    } else {
                                      setError(res.data.message);
                                    }
                                  })
                                  .catch((eX) => {
                                    if (eX.response) {
                                      setError(eX.response.data.message);
                                    } else {
                                      setError(eX.message);
                                    }
                                  });
                              }
                            });
                          }}
                        >
                          Remove
                        </FormButton>
                      </Grid>
                    </RequireRole>
                  </Grid>
                </div>
              </Card> */}
              <Card className="h-full relative">
                <div>
                  <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                    Credit User
                  </h1>
                  <div className="flex flex-col items-center py-3">
                    <input
                      type="number"
                      name="balance"
                      id="balance"
                      className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                      required={true}
                      placeholder={"Amount"}
                      defaultValue={orderData.productPrice}
                    />
                  </div>
                  <Grid className="mt-20" container spacing={1}>
                    <Grid item xs={6}>
                      <FormButton
                        color={"green"}
                        onClickLoading={() => {
                          // POST /api/user/update/balance?add=true {id: orderData.userId, balance: amount}
                          const amount = parseFloat(
                            (
                              document.getElementById(
                                "balance"
                              ) as HTMLInputElement
                            ).value
                          );
                          return getReason((reason) => {
                            return axios
                              .post("/api/user/update/balance/?add=true", {
                                id: order.user,
                                balance: amount,
                                reason,
                                orderId: order._id,
                              })
                              .then((res) => {
                                if (res.data.success) {
                                  snackbar.enqueueSnackbar(res.data.message, {
                                    variant: "success",
                                  });
                                } else {
                                  setError(res.data.message);
                                  Swal.fire({
                                    title: "Error",
                                    text: res.data.message,
                                    icon: "error",
                                  });
                                }
                              })
                              .catch((eX) => {
                                Swal.fire({
                                  title: "Error",
                                  text:
                                    eX?.response?.data?.message ||
                                    "Failed to update balance",
                                  icon: "error",
                                });
                              });
                          });
                        }}
                      >
                        Add
                      </FormButton>
                    </Grid>
                    <Grid item xs={6}>
                      <FormButton
                        color={"red"}
                        onClickLoading={() => {
                          const amount = parseFloat(
                            (
                              document.getElementById(
                                "balance"
                              ) as HTMLInputElement
                            ).value
                          );
                          return getReason((reason) => {
                            return axios
                              .post("/api/user/update/balance/?subtract=true", {
                                id: order.user,
                                balance: amount,
                                reason,
                                orderId: order._id,
                              })
                              .then((res) => {
                                if (res.data.success) {
                                  snackbar.enqueueSnackbar(res.data.message, {
                                    variant: "success",
                                  });
                                } else {
                                  setError(res.data.message);
                                  Swal.fire({
                                    title: "Error",
                                    text: res.data.message,
                                    icon: "error",
                                  });
                                }
                              })
                              .catch((eX) => {
                                Swal.fire({
                                  title: "Error",
                                  text:
                                    eX?.response?.data?.message ||
                                    "Failed to update balance",
                                  icon: "error",
                                });
                              });
                          });
                        }}
                      >
                        Deduct
                      </FormButton>
                    </Grid>
                  </Grid>
                </div>
              </Card>
            </Grid>
          </Grid>
          {/*<Grid item xs={12} md={4}>*/}
          {/*  <Card>*/}
          {/*    <div>*/}
          {/*      <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">*/}
          {/*        Set Status*/}
          {/*      </h1>*/}
          {/*      <div className="flex flex-col items-center py-3">*/}
          {/*        <select*/}
          {/*          id={"select-status"}*/}
          {/*          className="hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"*/}
          {/*          defaultValue={order.status}*/}
          {/*        >*/}
          {/*          {(showUnsafeStatuses ? orderStatuses : safeStatuses).map(*/}
          {/*            (status) => (*/}
          {/*              <option key={status} value={status}>*/}
          {/*                {status}*/}
          {/*              </option>*/}
          {/*            )*/}
          {/*          )}*/}
          {/*        </select>*/}
          {/*      </div>*/}
          {/*      <FormButton*/}
          {/*        onClickLoading={() => {*/}
          {/*          const status = (*/}
          {/*            document.getElementById(*/}
          {/*              "select-status"*/}
          {/*            ) as HTMLSelectElement*/}
          {/*          ).value;*/}
          {/*          // post /api/orders/update/status {id: order._id, status: status}*/}
          {/*          return getReason((reason) => {*/}
          {/*            return axios*/}
          {/*              .post("/api/orders/update/status", {*/}
          {/*                id: order._id,*/}
          {/*                status,*/}
          {/*                reason,*/}
          {/*              })*/}
          {/*              .then((res) => {*/}
          {/*                if (res.data.success) {*/}
          {/*                  snackbar.enqueueSnackbar(res.data.message, {*/}
          {/*                    variant: "success",*/}
          {/*                  });*/}
          {/*                  order.status = status;*/}
          {/*                  rerender();*/}
          {/*                } else {*/}
          {/*                  setError(res.data.message);*/}
          {/*                  snackbar.enqueueSnackbar(res.data.message, {*/}
          {/*                    variant: "error",*/}
          {/*                  });*/}
          {/*                }*/}
          {/*              })*/}
          {/*              .catch((eX) => {*/}
          {/*                const eMsg =*/}
          {/*                  eX?.response?.data?.message ||*/}
          {/*                  "Failed to update status";*/}
          {/*                setError(eMsg);*/}
          {/*                snackbar.enqueueSnackbar(eMsg, {*/}
          {/*                  variant: "error",*/}
          {/*                });*/}
          {/*              });*/}
          {/*          });*/}
          {/*        }}*/}
          {/*      >*/}
          {/*        Update*/}
          {/*      </FormButton>*/}
          {/*    </div>*/}
          {/*  </Card>*/}
          {/*</Grid>*/}
          <Grid item xs={12} md={12}>
            <Card>
              <div>
                <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                  Cart
                </h1>
                <div className="flex flex-col items-center pt-3">
                  <div
                    style={{
                      height: 300,
                      width: "100%",
                    }}
                  >
                    <DataGridPro
                      columns={[
                        {
                          field: "productName",
                          headerName: "Product Name",
                          width: 225,
                        },
                        {
                          field: "productPrice",
                          headerName: "Product Price",
                          width: 175,
                          renderCell: (params) => {
                            return <>${params.row.productPrice}</>;
                          },
                        },
                        {
                          field: "productQuantity",
                          headerName: "Product Quantity",
                          width: 175,
                          renderCell: (params) => {
                            return <>{params.row.productQuantity}x</>;
                          },
                        },
                        {
                          field: "productOption",
                          headerName: "Product Option",
                          width: 100,
                        },
                        {
                          field: "status",
                          headerName: "Status",
                          width: 200,
                          renderCell: (params) => {
                            return <OrderStatus status={params.row.status} />;
                          },
                        },
                        {
                          field: "Actions",
                          headerName: "Actions",
                          width: 350,
                          renderCell: (params) => {
                            return (
                              <div className={"flex items-center gap-3 ml-8"}>
                                {params.row.status == "completed" ||
                                params.row.status == "complete" ? (
                                  <Link
                                    href={`/stock/${params.row.stocks[0].id}/`}
                                  >
                                    <div
                                      className={
                                        "bg-blue-600 text-sm px-4 py-0.5 rounded-[5px] flex items-center gap-2"
                                      }
                                    >
                                      <Pen size={17} /> Edit stock
                                    </div>
                                  </Link>
                                ) : (
                                  <div
                                    onClick={() => {
                                      return Swal.fire({
                                        title: "Are you sure?",
                                        text: "After approve product will granted to customer!",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: "Yes",
                                      }).then(async (result) => {
                                        if (result.isConfirmed) {
                                          await axios
                                            .post(
                                              "/api/orders/queue/approve_product",
                                              {
                                                orderId: order._id,
                                                productId: params.row.product,
                                              }
                                            )
                                            .then((res) => {
                                              snackbar.enqueueSnackbar(
                                                "Approved Successfully",
                                                {
                                                  variant: "success",
                                                }
                                              );
                                              router.replace(router.asPath);
                                            })
                                            .catch((err) => {
                                              snackbar.enqueueSnackbar(
                                                err.response.data.message,
                                                {
                                                  variant: "error",
                                                }
                                              );
                                            });
                                        }
                                      });
                                    }}
                                    className={
                                      "bg-blue-600 text-sm px-4 py-0.5 rounded-[5px] flex items-center gap-2 hover:cursor-pointer hover:bg-blue-700"
                                    }
                                  >
                                    Approve
                                  </div>
                                )}

                                <div
                                  onClick={() => {
                                    // ask user if it should pull from stock or they want to upload, add a field for pull amount
                                    setOrderDetails({
                                      orderId: order._id,
                                      productId: params.row.product,
                                      optionId: params.row.productOptionId,
                                      subOrderId: params.row._id,
                                      orderStock: params.row.stockLines,
                                    });
                                    document
                                      .getElementById("stock-modal")
                                      ?.classList.remove("hidden");
                                  }}
                                  className={
                                    "bg-blue-600 text-sm px-4 py-0.5 rounded-[5px] flex items-center gap-2 hover:cursor-pointer hover:bg-blue-700"
                                  }
                                >
                                  <Plus size={17} /> Add replacement
                                </div>
                              </div>
                            );
                          },
                          type: "actions",
                        },
                      ]}
                      rows={orderData.map((x: any, idx: number) => {
                        return { id: idx, ...x };
                      })}
                      disableColumnFilter
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Grid>
          {order.paid && (
            <>
              <Grid item xs={12} md={12}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                      Received Stock
                    </h1>
                    <div className="flex flex-col items-center pt-3">
                      <div
                        style={{
                          height: 300,
                          width: "100%",
                        }}
                      >
                        <DataGridPro
                          columns={[
                            {
                              field: "_id",
                              headerName: "Stock ID",
                              width: 225,
                            },
                            {
                              field: "firstAccessed",
                              headerName: "First Accessed",
                              width: 175,
                              renderCell: (params) => {
                                return (
                                  <>
                                    {params.row.firstAccessed
                                      ? new Date(
                                          params.row.firstAccessed
                                        ).toLocaleString()
                                      : "Never Opened"}
                                  </>
                                );
                              },
                            },
                            {
                              field: "lastAccessed",
                              headerName: "Last Accessed",
                              width: 175,
                              renderCell: (params) => {
                                return (
                                  <>
                                    {params.row.lastAccessed
                                      ? new Date(
                                          params.row.lastAccessed
                                        ).toLocaleString()
                                      : "Never Opened"}
                                  </>
                                );
                              },
                            },
                            {
                              field: "replacement",
                              headerName: "Replacement",
                              width: 100,
                              renderCell: (params) => {
                                return (
                                  <>{params.row.replacement ? "Yes" : "No"}</>
                                );
                              },
                            },
                            {
                              field: "Actions",
                              headerName: "Actions",
                              width: 350,
                              renderCell: (params) => {
                                return (
                                  <>
                                    <Stack direction={"row"} spacing={2}>
                                      <FormButton
                                        color="red"
                                        onClickLoading={() => {
                                          return Swal.fire({
                                            title: "Are you sure?",
                                            text: "You will not be able to recover this stock!",
                                            icon: "warning",
                                            showCancelButton: true,
                                            confirmButtonText: "Yes",
                                          }).then((result) => {
                                            if (result.isConfirmed) {
                                              axios
                                                .post(
                                                  `/api/stock/delete/${params.row.id}?order=${order._id}`
                                                )
                                                .then((res) => {
                                                  if (res.data.success) {
                                                    window.location.href = `/admin/orders/${order._id}?info=${res.data.message}`;
                                                  } else {
                                                    setError(res.data.message);
                                                  }
                                                })
                                                .catch((eX) => {
                                                  errorLog(eX);
                                                  if (eX.response) {
                                                    setError(
                                                      eX.response.data.message
                                                    );
                                                  } else {
                                                    setError(eX.message);
                                                  }
                                                });
                                            }
                                          });
                                        }}
                                      >
                                        Remove
                                      </FormButton>
                                      {product &&
                                        product.stockCheckerConfig?.enabled && (
                                          <FormButton
                                            color="primary"
                                            onClickLoading={() => {
                                              return axios
                                                .get(
                                                  `/api/stock/${params.row.id}/verify`
                                                )
                                                .then((res) => {
                                                  const { data } = res;
                                                  ReactSwal.fire({
                                                    title: "Stock Status",
                                                    html: (
                                                      <>
                                                        {data.note
                                                          .split("\n")
                                                          .map(
                                                            (
                                                              n: string,
                                                              i: number
                                                            ) => {
                                                              return (
                                                                <span
                                                                  key={i}
                                                                  className={
                                                                    "block"
                                                                  }
                                                                >
                                                                  {n}
                                                                </span>
                                                              );
                                                            }
                                                          )}
                                                      </>
                                                    ),
                                                    icon: "info",
                                                  }).then(() => {
                                                    window.location.reload();
                                                  });
                                                })
                                                .catch((e) => {
                                                  Swal.fire({
                                                    title: "Error",
                                                    text:
                                                      e.response?.data
                                                        ?.message ||
                                                      "An error occurred!",
                                                    icon: "error",
                                                  });
                                                });
                                            }}
                                          >
                                            Validate
                                          </FormButton>
                                        )}
                                      <Link
                                        className={
                                          "bg-blue-600 text-white flex justify-center items-center rounded-lg px-4 text-center"
                                        }
                                        href={`/stock/${params.row.id}/`}
                                      >
                                        View
                                      </Link>
                                    </Stack>
                                  </>
                                );
                              },
                              type: "actions",
                            },
                          ]}
                          rows={orderData
                            .map((x: any) => x.stocks.map((y: any) => y))
                            .flat(1)}
                          disableColumnFilter
                        />
                      </div>
                    </div>
                    {/*<FormButton*/}
                    {/*  fullWidth*/}
                    {/*  className={"mt-2"}*/}
                    {/*  // href={`/admin/orders/${order._id}/replacement`}*/}

                    {/*>*/}
                    {/*  Add Replacement*/}
                    {/*</FormButton>*/}
                  </div>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </AdminNavProvider>
    </>
  );
};

export default OrderAdminPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  const order = await resolveOrder(id as string);
  if (!order) {
    return {
      notFound: true,
    };
  }
  const { info, error } = context.query;
  const subOrder = JSON.parse(
    JSON.stringify(order.subOrders)
  ) as SubOrderInterface;
  const FlaggedModel = await getFlaggedEmailModel();
  const isFlagged = await FlaggedModel.findOne({
    $or: [
      {
        email: order.email.toLowerCase(),
      },
      ...(order.user ? [{ user: order.user }] : []),
    ],
  });
  const ProductModel = await getProductModel();

  return {
    props: {
      order: JSON.parse(JSON.stringify(order)),
      orderData: subOrder,
      infoAlert: info || "",
      errorAlert: error || "",
      flagged: isFlagged ? isFlagged._id.toString() : null,
      // product: JSON.parse(
      //   JSON.stringify(await ProductModel.findById(subOrder.product)))
    },
  };
}
