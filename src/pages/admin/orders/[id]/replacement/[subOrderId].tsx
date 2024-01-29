import React, { useState } from "react";

import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import StockEditor from "@components/admin/StockEditor";
import Alert from "@components/Alert";
import { resolveOrder } from "@models/order";
import { getReason } from "@util/ClientUtils";
import { debug } from "@util/log";
import { useSnackbar } from "notistack";

const Replacement = ({
  order,
  infoAlert,
  errorAlert,
  subOrderId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const [inf, setInfo] = useState<string>(infoAlert as string);
  const [err, setError] = useState<string>(errorAlert as string);
  const [data, setData] = useState<string>("");
  const snackbar = useSnackbar();
  return (
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
      <div className="text-xl">
        <p className="font-bold text-3xl">
          Order · <span className={"text-xl"}>{order._id}</span> ·{" "}
          <span className={"text-xl"}>{subOrderId}</span> · Replacement
        </p>
      </div>
      <StockEditor
        data={data}
        setData={setData}
        save={(arr) => {
          // POST /api/stock/upload/replacement {data: arr, orderId: order._id}
          return new Promise((resolve, reject) => {
            getReason((reason) => {
              return axios
                .post("/api/stock/upload/replacement/", {
                  data: arr,
                  orderId: order._id.toString(),
                  subOrderId,
                  reason,
                })
                .then((res) => {
                  debug(res);
                  if (res.data?.success) {
                    snackbar.enqueueSnackbar("Saved", {
                      variant: "success",
                    });

                    window.location.href = `/admin/orders/${order._id.toString()}/`;
                  } else {
                    Swal.fire({
                      title: "Error!",
                      icon: "error",
                      text: res.data?.message || "Something went wrong!",
                    });
                  }
                  resolve();
                })
                .catch((eX: any) => {
                  debug(eX);
                  Swal.fire({
                    title: "Error!",
                    icon: "error",
                    text: eX.response.data.message || eX.message,
                  });
                  reject(eX);
                });
            });
          });
        }}
      />
      <a href={`/admin/orders/${order._id.toString()}/`}>
        <span className="text-sm hover-circle hover:cursor-pointer font-medium hover:underline text-white float-left pb-5 mt-[30px]">
          <HiArrowNarrowLeft className="inline-block mr-1" />
          Back
        </span>
      </a>
    </AdminNavProvider>
  );
};

export default Replacement;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, subOrderId } = context.query;
  const order = await resolveOrder(id as string);
  if (!order) {
    return {
      notFound: true,
    };
  }
  const { info, error } = context.query;
  return {
    props: {
      order: JSON.parse(JSON.stringify(order)),
      infoAlert: info || "",
      errorAlert: error || "",
      subOrderId,
    },
  };
}
