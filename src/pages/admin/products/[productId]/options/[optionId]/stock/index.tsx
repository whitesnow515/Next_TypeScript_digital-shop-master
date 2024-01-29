import React, { useEffect, useState } from "react";

import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import StockEditor from "@components/admin/StockEditor";
import Alert from "@components/Alert";
import getProductModel from "@models/product";
import { debug } from "@util/log";
import RequireRole from "@components/auth/RequireRole";

const StockPage = ({
  initialSuccess,
  product,
  productId,
  option,
  optionId,
  info,
  error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const snackbar = useSnackbar();
  const [inf, setInfo] = useState<string>(info as string);
  const [err, setError] = useState<string>(error as string);

  const [data, setData] = useState<string>(product);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialSuccess) {
      axios
        .get(`/api/stock/${productId}/${optionId}/get/`)
        .then((res) => {
          if (res.data.success) {
            const stockData: string[] = res.data.data.data; // wtf
            setData(stockData.join("\n"));
            setSuccess(true);
          } else {
            setError(res.data.message);
          }
        })
        .catch((eX) => {
          if (eX.response?.data?.noStock) {
            setData("");
            setSuccess(true);
            return;
          }
          debug(eX);
          setError(eX.response?.data?.message || "Failed to get stock data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
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
        <p className="font-bold text-3xl">
          {product.name} / {option.name}
          <span className={"text-xl"}> - Stock</span>
        </p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {success ? (
              <>
                <StockEditor
                  data={data}
                  setData={setData}
                  renderInfo={(d) => (
                    <>
                      {d.split("\n").length.toLocaleString()} line(s) (
                      {Math.floor(d.split("\n").length / option.stockLines)}{" "}
                      stock units, {option.stockLines} line(s) per)
                    </>
                  )}
                  save={(arr) => {
                    // POST /api/stock/upload/:productId/:optionId/text/ {data: string[]}
                    return axios
                      .post(
                        `/api/stock/upload/${productId}/${optionId}/text/`,
                        {
                          data: arr,
                          behavior: "replace",
                        }
                      )
                      .then((res) => {
                        if (res.data.success) {
                          snackbar.enqueueSnackbar("Saved", {
                            variant: "success",
                          });
                        } else {
                          Swal.fire({
                            title: "Failed to save",
                            html: res.data?.message || "Unknown error",
                            icon: "error",
                          });
                        }
                      })
                      .catch((eX) => {
                        Swal.fire({
                          title: "Failed to save",
                          html: eX?.message || "Unknown error",
                          icon: "error",
                        });
                      });
                  }}
                />
              </>
            ) : (
              <p>Failed to load stock data</p>
            )}
          </>
        )}
      </RequireRole>
    </AdminNavProvider>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { productId, optionId, info, error } = context.query;
  const ProductModel = await getProductModel();
  const data: any = await ProductModel.findById(productId as string);
  if (!data) {
    return {
      props: {
        initialSuccess: false,
        message: "Product not found",
        error: error || "",
        info: info || "",
        productId,
        optionId,
      },
    };
  }
  const { options } = data;
  const finalOption = options.find((option: any) => {
    return option._id.toString() === (optionId as string);
  });
  if (!finalOption) {
    return {
      props: {
        initialSuccess: false,
        message: "Option not found",
        error: error || "",
        info: info || "",
        productId,
        optionId,
      },
    };
  }
  return {
    props: {
      initialSuccess: true,
      productId,
      optionId,
      info: info || "",
      error: error || "",
      option: JSON.parse(JSON.stringify(finalOption)),
      product: JSON.parse(JSON.stringify(data)),
    },
  };
}

export default StockPage;
