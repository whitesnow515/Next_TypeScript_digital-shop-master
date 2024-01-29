import React from "react";

import { Stack } from "@mui/material";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import OrdersGrid from "@components/admin/OrdersGrid";
import Alert from "@components/Alert";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { debug, error as errorLog } from "@util/log";

const QueuePage = () => {
  const snackbar = useSnackbar();
  const session = useSession();
  const [error, setError] = React.useState<string>();
  const [info, setInfo] = React.useState<string>();

  return (
    <AdminNavProvider session={session}>
      <Meta title={`Queue`} description={"Admin orders page"} />
      <h1 className={"text-2xl mt-2.5 font-bold"}>Order Verification Queue</h1>
      {error && error !== "" && (
        <>
          <Alert
            type={"error"}
            dismissible={true}
            onDismiss={() => setError("")}
          >
            {error}
          </Alert>
        </>
      )}
      {info && info !== "" && (
        <>
          <Alert
            type={"success"}
            dismissible={true}
            onDismiss={() => setInfo("")}
          >
            {info}
          </Alert>
        </>
      )}
      <OrdersGrid
        setError={setError}
        grabFromParams={true}
        height={"75vh"}
        verificationQueue
        showPaidOrdersSwitch={false}
        renderActions={(params, refetch) => {
          const item = params.row.subOrders[0];
          debug(item);
          return (
            <Stack direction={"row"} spacing={2}>
              <FormButton
                onClickLoading={(e) => {
                  e.stopPropagation();
                  // POST /api/orders/queue/approve {id: params.row._id}
                  return Swal.fire({
                    title: "Are you sure?",
                    text: "This will approve the order and allocate stock.",
                    icon: "warning",
                    showCancelButton: true,
                  }).then((result) => {
                    if (result.isConfirmed) {
                      axios
                        .post("/api/orders/queue/approve/", {
                          id: params.row._id,
                        })
                        .then(async (res) => {
                          if (res.data.success) {
                            snackbar.enqueueSnackbar("Order approved", {
                              variant: "success",
                            });
                            // re-fetch data
                            await refetch();
                          } else {
                            snackbar.enqueueSnackbar("Order approval failed", {
                              variant: "error",
                            });
                          }
                        })
                        .catch((err) => {
                          errorLog(err);
                          snackbar.enqueueSnackbar("Order approval failed", {
                            variant: "error",
                          });
                        });
                    }
                  });
                }}
                color={"green"}
              >
                Approve
              </FormButton>
              <FormButton
                onClickLoading={(e) => {
                  e.stopPropagation();
                  return Swal.fire({
                    title: "Are you sure?",
                    text: "This will deny the order.",
                    icon: "warning",
                    showCancelButton: true,
                  }).then((result) => {
                    if (result.isConfirmed) {
                      axios
                        .post("/api/orders/queue/deny/", {
                          id: params.row._id,
                        })
                        .then(async (res) => {
                          if (res.data.success) {
                            snackbar.enqueueSnackbar("Order denied", {
                              variant: "success",
                            });
                            // re-fetch data
                            // await refetch();
                            const orderData = params.row.subOrders[0];
                            if (orderData) {
                              const productId = orderData.product;
                              const optionId = orderData.productOptionId;
                              window.location.href = `/admin/products/${productId}/options/${optionId}/stock`;
                            }
                          } else {
                            snackbar.enqueueSnackbar("Order denial failed", {
                              variant: "error",
                            });
                          }
                        })
                        .catch((err) => {
                          errorLog(err);
                          snackbar.enqueueSnackbar("Order denial failed", {
                            variant: "error",
                          });
                        });
                    }
                  });
                }}
                color={"red"}
              >
                Deny
              </FormButton>
              <FormButton
                href={`/admin/orders/${params.row._id}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                View
              </FormButton>
            </Stack>
          );
        }}
      />
    </AdminNavProvider>
  );
};

export default QueuePage;
