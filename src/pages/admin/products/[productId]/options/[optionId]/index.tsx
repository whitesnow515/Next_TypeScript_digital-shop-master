import React, { useEffect, useState } from "react";

import { FormControlLabel, Grid, Switch } from "@mui/material";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import { ProductOptionWithStock } from "@app-types/models/product";
import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import getProductModel from "@models/product";
import { getPrice } from "@util/EasterEgg";
import { error } from "@util/log";
import { useRerenderHelper } from "@util/ReRenderHelper";
import getStockManager from "@util/stock/StockManagerHolder";
import RequireRole from "@components/auth/RequireRole";

const OptionsPage = ({
  success,
  message,
  data,
  infAlert,
  errAlert,
  productId,
  product,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const rerender = useRerenderHelper();
  const [inf, setInfo] = useState<string>(infAlert as string);
  const [err, setError] = useState<string>(errAlert as string);

  useEffect(() => {
    if (message) {
      if (success) setInfo(message);
      else setError(message);
    }
  }, [message, success]);
  const updateName = (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    axios
      .post(`/api/products/update/name/?option=${data._id}`, {
        id: productId,
        name,
      })
      .then((res) => {
        window.location.href = `/admin/products/${productId}/options/${data._id}?info=${res.data.message}`;
      })
      .catch((errorRes) => {
        error(errorRes);
      });
  };
  const updatePrice = (e: any) => {
    e.preventDefault();
    const price = parseFloat(e.target.price.value);
    axios
      .post(`/api/products/update/options/${data._id}/price/`, {
        id: productId,
        price,
      })
      .then((res) => {
        window.location.href = `/admin/products/${productId}/options/${data._id}?info=${res.data.message}`;
      })
      .catch((errorRes) => {
        error(errorRes);
      });
  };
  const updateWarranty = (e: any) => {
    e.preventDefault();
    const warranty = parseInt(e.target.warrantyHrs.value, 10);
    axios
      .post(`/api/products/update/warranty/?option=${data._id}`, {
        id: productId,
        warranty,
      })
      .then((res) => {
        if (res.data.success) {
          window.location.href = `/admin/products/${productId}/options/${data._id}?info=${res.data.message}`;
        } else {
          setError(res.data.message);
        }
      })
      .catch((errorRes) => {
        error(errorRes);
      });
  };
  return (
    <>
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
          {data && (
            <>
              <div className="text-white text-xl pb-2">
                <p className="font-bold text-3xl">
                  {product.name} / {data.name}
                  <span className={"text-xl"}> - Option</span>
                </p>
                <p className="inline-block mx-2.5 text-xl">
                  {getPrice(data.price)}
                </p>
                ·
                <p className="inline-block mx-2.5 text-xl">
                  {data.stock} in stock
                </p>
                ·
                <p className="inline-block ml-2.5 text-xl">
                  {data.timesBought} Units Sold (this option)
                </p>
              </div>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Name
                    </h1>
                    <form
                      className="space-y-4 md:space-y-6"
                      onSubmit={updateName}
                    >
                      <div className={"pt-4"}>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          defaultValue={data.name}
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.name}
                          required={true}
                        ></input>
                      </div>
                      <FormButton type={"submit"}>Update Name</FormButton>
                    </form>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Price
                    </h1>
                    <form
                      className="space-y-4 md:space-y-6"
                      onSubmit={updatePrice}
                    >
                      <div className={"pt-4"}>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          step={0.01}
                          defaultValue={data.price}
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.price}
                          required={true}
                        ></input>
                      </div>
                      <FormButton type={"submit"}>Update Price</FormButton>
                    </form>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Hold Orders
                    </h1>
                    <div className={"pt-4 flex-col"}>
                      <span className="text-white">
                        This will hold all completed orders for manual review.
                        (Except verified users)
                      </span>
                      <span
                        className={`flex justify-center text-xl text-${
                          data.holdAllOrders || product.holdAllOrders
                            ? "green"
                            : "red"
                        }-500 pb-4`}
                      >
                        {data.holdAllOrders || product.holdAllOrders
                          ? "On"
                          : "Off"}
                      </span>
                      <FormButton
                        disabled={product.holdAllOrders}
                        onClickLoading={() => {
                          return axios
                            .post(
                              `/api/products/update/hold/?option=${data._id}`,
                              {
                                id: product._id,
                                hold: !data.holdAllOrders,
                              }
                            )
                            .then((res) => {
                              if (res.data.success) {
                                setInfo(res.data.message);
                                data.holdAllOrders = !data.holdAllOrders;
                              } else {
                                setError(res.data.message);
                              }
                            })
                            .catch((errorRes) => {
                              error(errorRes);
                              if (errorRes?.response?.data?.message)
                                setError(errorRes.response.data.message);
                              else setError(`An error occurred!`);
                            })
                            .finally(() => {
                              rerender();
                            });
                        }}
                        color={data.holdAllOrders ? "red" : "green"}
                      >
                        {data.holdAllOrders ? "Disable" : "Enable"}
                      </FormButton>

                      {product.holdAllOrders && (
                        <span
                          className={
                            "text-gray-500 text-sm pt-4 flex justify-center"
                          }
                        >
                          This option is currently disabled because it is
                          enabled on the product.
                        </span>
                      )}
                    </div>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Limits
                    </h1>
                    <form
                      className="space-y-4 md:space-y-6"
                      onSubmit={updateWarranty}
                    >
                      <div className={"pt-4"}>
                        <label htmlFor={"warrantyHrs"}>Minimum Order</label>
                        <input
                          type="number"
                          name="warrantyHrs"
                          id="warrantyHrs"
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.minimum}
                          defaultValue={data.minimum}
                          required={true}
                        />
                      </div>
                      <div className={"pt-4"}>
                        <label htmlFor={"warrantyHrs"}>Maximum Order</label>
                        <input
                          type="number"
                          name="warrantyHrs"
                          id="warrantyHrs"
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.maximum}
                          defaultValue={data.maximum}
                          required={true}
                        />
                      </div>
                      <FormButton type={"submit"}>Update Warranty</FormButton>
                    </form>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Warranty
                    </h1>
                    <form
                      className="space-y-4 md:space-y-6"
                      onSubmit={updateWarranty}
                    >
                      <div className={"pt-4"}>
                        <label htmlFor={"warrantyHrs"}>Warranty Hours</label>
                        <input
                          type="number"
                          name="warrantyHrs"
                          id="warrantyHrs"
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.warrantyHours}
                          defaultValue={data.warrantyHours}
                          required={true}
                        />
                      </div>
                      <div>
                        <FormControlLabel
                          control={
                            <Switch
                              defaultChecked={data.warrantyEnabled}
                              onChange={() => {
                                axios
                                  .post(
                                    `/api/products/update/warrantyToggle/?option=${data._id}`,
                                    {
                                      id: productId,
                                      warranty: !data.warrantyEnabled,
                                    }
                                  )
                                  .then((res) => {
                                    if (res.data.success) {
                                      window.location.href = `/admin/products/${productId}/options/${data._id}/?info=${res.data.message}`;
                                    } else {
                                      setError(res.data.message);
                                    }
                                  })
                                  .catch((errorRes) => {
                                    error(errorRes);
                                    if (errorRes?.response?.data?.message)
                                      setError(errorRes.response.data.message);
                                    else setError(`An error occurred!`);
                                  });
                              }}
                            />
                          }
                          label="Enable Warranty"
                        />
                      </div>
                      <FormButton type={"submit"}>Update Warranty</FormButton>
                    </form>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Lines to Distribute
                    </h1>
                    <span
                      className={
                        "text-gray-500 text-sm pt-4 flex justify-center"
                      }
                    >
                      Number of lines from the stock to distribute per purchase.
                      (multiplied by quantity)
                    </span>
                    <div className="space-y-4 md:space-y-6">
                      <div className={"pt-4"}>
                        <label htmlFor={"lines"}>Lines</label>
                        <input
                          type="number"
                          name="lines"
                          id="lines"
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder={data.stockLines}
                          defaultValue={data.stockLines}
                          required={true}
                        />
                      </div>
                      <FormButton
                        type={"submit"}
                        onClickLoading={(e) => {
                          e.preventDefault();
                          const lines = parseInt(
                            (
                              document.getElementById(
                                "lines"
                              ) as HTMLInputElement
                            )?.value ?? "1",
                            10
                          );
                          return axios
                            .post(`/api/products/update/stockLines/`, {
                              id: productId,
                              option: data._id.toString(),
                              lines,
                            })
                            .then((res) => {
                              if (res.data.success) {
                                window.location.href = `/admin/products/${productId}/options/${data._id}?info=${res.data.message}`;
                              } else {
                                setError(res.data.message);
                              }
                            })
                            .catch((errorRes) => {
                              error(errorRes);
                            });
                        }}
                      >
                        Update Lines
                      </FormButton>
                    </div>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      {data.hidden ? "Hidden" : "Shown"}
                    </h1>
                    <div className={"pt-4 flex-col"}>
                      <FormButton
                        disabled={data.default}
                        onClickLoading={() => {
                          return axios
                            .post(
                              `/api/products/update/hidden/?option=${data._id}`,
                              {
                                id: productId,
                                hidden: !data.hidden,
                              }
                            )
                            .then((res) => {
                              if (res.data.success) {
                                setInfo(res.data.message);
                                data.hidden = !data.hidden;
                              } else {
                                setError(res.data.message);
                              }
                            })
                            .catch((errorRes) => {
                              error(errorRes);
                              if (errorRes?.response?.data?.message)
                                setError(errorRes.response.data.message);
                              else setError(`An error occurred!`);
                            })
                            .finally(() => {
                              rerender();
                            });
                        }}
                      >
                        {data.hidden ? "Unhide" : "Hide"}
                      </FormButton>

                      {data.default && (
                        <span
                          className={
                            "text-gray-500 text-sm pt-4 flex justify-center"
                          }
                        >
                          This option is currently disabled it is the default
                          option for this product. Please make another option
                          the default option before you can hide this option.
                        </span>
                      )}
                    </div>
                  </Card>
                  <Card>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center mb-4">
                      Stock
                    </h1>
                    <FormButton
                      href={`/admin/products/${productId}/options/${data._id}/stock/`}
                    >
                      Open Stock Page
                    </FormButton>
                  </Card>
                </Grid>
              </Grid>
              <a href={`/admin/products/${productId}`}>
                <span className="text-sm hover-circle hover:cursor-pointer font-medium hover:underline text-white float-left pl-5">
                  <HiArrowNarrowLeft className="inline-block mr-1" />
                  Back
                </span>
              </a>
            </>
          )}
        </RequireRole>
      </AdminNavProvider>
    </>
  );
};

export default OptionsPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { info, optionId, productId } = context.query;
  const err = context.query.error;
  const ProductModel = await getProductModel();
  const data: any = await ProductModel.findById(productId as string);
  if (!data) {
    return {
      notFound: true,
    };
  }
  const { options } = data;
  const finalOption: ProductOptionWithStock = options.find((option: any) => {
    return option._id.toString() === (optionId as string);
  }) as ProductOptionWithStock;
  if (!finalOption) {
    return {
      props: {
        success: false,
        message: "Option not found",
        errAlert: err || "",
        infAlert: info || "",
        productId,
      },
    };
  }
  const stock = await getStockManager().getStockAmount(
    productId as string,
    optionId as string
  );
  const d = JSON.parse(JSON.stringify(finalOption));
  d.stock = stock;
  return {
    props: {
      success: true,
      message: "",
      errAlert: err || "",
      infAlert: info || "",
      data: d,
      productId,
      product: JSON.parse(JSON.stringify(data)),
    },
  };
}
