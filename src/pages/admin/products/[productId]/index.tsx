import React, { useEffect, useState } from "react";

import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import { HiArrowNarrowLeft } from "react-icons/hi";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import MarkdownEditor from "@components/admin/MarkdownEditor";
import StockCheckerSettings from "@components/admin/stock-checker";
import Alert from "@components/Alert";
import RequireRole from "@components/auth/RequireRole";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import getProductModel, { getProductCategoryModel } from "@models/product";
import { getPrice } from "@util/EasterEgg";
import { error, info as infoLog, log } from "@util/log";
import { useRerenderHelper } from "@util/ReRenderHelper";
import getStockManager from "@util/stock/StockManagerHolder";

const ProductPage = ({
  success,
  message,
  stock,
  productData,
  infAlert,
  errAlert,
  categories,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const rerender = useRerenderHelper();
  const session = useSession();
  const [inf, setInfo] = useState<string>(infAlert as string);
  const [err, setError] = useState<string>(errAlert as string);
  const [note, setNote] = useState<string>(productData?.note || "");
  const router = useRouter();
  const snackbar = useSnackbar();
  const [minimum, setMinimum] = React.useState(productData.minimum);
  const [maximum, setMaximum] = React.useState(productData.minimum);
  const [description, setDescription] = useState<string>("");
  useEffect(() => {
    if (productData) {
      const desc = productData.description || "";
      infoLog({ desc });
      setDescription(desc);
    }
  }, [productData, infAlert]);
  useEffect(() => {
    if (message) {
      if (success) setInfo(message);
      else setError(message);
    }
  }, [message, success]);

  const update = async (body: { minimum?: any; maximum?: any }) => {
    try {
      await axios.post(`/api/products/${productData._id}/`, body, {
        withCredentials: true,
      });
      snackbar.enqueueSnackbar(`Changes saved`, {
        variant: "success",
      });
    } catch (e) {
      Swal.fire({
        title: "Could not save changes",
        text: "Failed to save minimum and maximum settings for product",
        icon: "error",
      });
    }
  };
  const updateImage = async (e: any) => {
    e.preventDefault();
    if (!productData) return;
    const updateImageAfterUpload = async (image: string) => {
      const res = await axios
        .post("/api/products/update/image/", {
          id: productData._id,
          image,
        })
        .then(async () => {
          snackbar.enqueueSnackbar(`Image successfully updated`, {
            variant: "success",
          });
          await router.replace(router.asPath);
        })
        .catch((eX) => {
          error(eX);
          if (eX?.response?.data?.message) setError(eX.response.data.message);
          else setError(`An error occurred!`);
        });
    };
    try {
      const currentImage = productData.image || "";
      const imageUrlChanged =
        (document.getElementById("imageUrl") as HTMLInputElement)?.value !==
        currentImage;
      if (currentImage !== "" && currentImage.indexOf("http") === -1) {
        // this is an asset id
        await axios
          .delete(`/api/assets/remove/${currentImage}/?type=product-img`)
          .catch((eX) => {
            log("Got error response when trying to remove old image", eX);
            // do nothing, it doesn't matter if it fails
          });
      }
      const imageUrl = (document.getElementById("imageUrl") as HTMLInputElement)
        ?.value;
      if (imageUrlChanged) {
        await updateImageAfterUpload(imageUrl);
      } else {
        const file = e.target.image.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("files", file);
          const config = {
            headers: { "content-type": "multipart/form-data" },
            onUploadProgress: (event: any) => {
              log(
                `Current progress:`,
                Math.round((event.loaded * 100) / event.total)
              );
            },
          };
          axios
            .post("/api/assets/upload/?type=product-img", formData, config)
            .then((res) => {
              infoLog(res.data);
              setTimeout(async () => {
                await updateImageAfterUpload(res.data.id);
              }, 1000);
            })
            .catch((eX) => {
              error(eX);
              setError("An error occurred while uploading the image.");
            });
        }
      }
    } catch (eX) {
      error(eX);
      setError(`An error occurred! - ${eX}`);
    }
  };
  const updateBannerImage = async (e: any) => {
    e.preventDefault();
    if (!productData) return;
    const updateImageAfterUpload = async (image: string) => {
      infoLog("Updating banner image", image);
      const res = await axios
        .post("/api/products/update/banner/", {
          id: productData._id,
          image,
        })
        .catch((eX) => {
          error(eX);
          if (eX?.response?.data?.message) setError(eX.response.data.message);
          else setError(`An error occurred!`);
        });
      if (res?.data?.error) {
        setError(res.data.message);
      } else {
        // setInfo("Successfully updated product!");
        await router.push(
          `/admin/products/${productData._id}?info=Successfully updated product banner image!`
        );
      }
    };
    try {
      const currentImage = productData.image || "";
      if (currentImage !== "" && currentImage.indexOf("http") === -1) {
        // this is an asset id
        await axios
          .delete(`/api/assets/remove/${currentImage}/?type=product-banner-img`)
          .catch((eX) => {
            log("Got error response when trying to remove old image", eX);
            // do nothing, it doesn't matter if it fails
          });
      }
      const imageUrl = (
        document.getElementById("bannerImageUrl") as HTMLInputElement
      )?.value;
      const imageUrlChanged = imageUrl !== productData.bannerImage;
      infoLog("ImageUrl", imageUrl);
      if (imageUrl && imageUrl.length > 0 && imageUrlChanged) {
        infoLog("Updating banner image", imageUrl);
        await updateImageAfterUpload(imageUrl);
      } else {
        infoLog("Updating banner image", "uploading");
        const file = e.target.image.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("files", file);
          const config = {
            headers: { "content-type": "multipart/form-data" },
            onUploadProgress: (event: any) => {
              log(
                `Current progress:`,
                Math.round((event.loaded * 100) / event.total)
              );
            },
          };
          axios
            .post(
              "/api/assets/upload/?type=product-banner-img",
              formData,
              config
            )
            .then((res) => {
              infoLog(res.data);
              setTimeout(async () => {
                await updateImageAfterUpload(res.data.id);
              }, 1000);
            })
            .catch((eX) => {
              error(eX);
              setError("An error occurred while uploading the image.");
            });
        }
      }
    } catch (eX) {
      error(eX);
      setError(`An error occurred! - ${eX}`);
    }
  };
  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "DB ID",
      width: 70,
    },
    { field: "name", headerName: "Name", width: 130 },
    {
      field: "price",
      headerName: "Price",
      width: 70,
      renderCell: (params) => {
        return <p className="text-right">{getPrice(params.value)}</p>;
      },
    },
    { field: "timesBought", headerName: "Sales", width: 70 },
    { field: "hidden", headerName: "Hidden", type: "boolean", width: 40 },
    { field: "stock", headerName: "Stock", width: 70 },
    {
      headerName: "Actions",
      width: 500,
      type: "actions",
      field: "_none_",
      renderCell: (params) => {
        const { row } = params;
        return (
          <div className="flex items-center w-full gap-2">
            <div>
              <FormButton
                className={"mr-4"}
                onClick={() =>
                  router.push(
                    `/admin/products/${productData._id}/options/${params.row._id}`
                  )
                }
              >
                Edit
              </FormButton>
            </div>
            <div>
              <FormButton
                className={"mr-4"}
                onClick={() =>
                  router.push(
                    `/admin/products/${productData._id}/options/${params.row._id}/stock`
                  )
                }
              >
                Stock
              </FormButton>
            </div>
            <div>
              <FormButton
                className={"mr-4"}
                onClick={() => {
                  const isDefault = row.default;
                  if (isDefault) {
                    // do nothing
                    return;
                  }
                  axios
                    .post("/api/products/update/options/default/", {
                      id: productData?._id.toString(),
                      defaultOption: row._id.toString(),
                    })
                    .then(async (res) => {
                      await router.push(
                        `/admin/products/${productData._id}?info=${
                          res?.data?.message ||
                          "Successfully updated default option!"
                        }`
                      );
                    })
                    .catch((errorRes) => {
                      error(errorRes);
                      if (errorRes?.response?.data?.message)
                        setError(errorRes.response.data.message);
                      else setError(`An error occurred!`);
                    });
                }}
                disabled={row.default}
              >
                {row.default ? "Default" : "Make Default"}
              </FormButton>
            </div>
            <div
              className={
                "text-black font-bold hover:cursor-pointer bg-[#FF1F40] scale-100 delay-100 transition hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center flex items-center gap-3 justify-center mr-4 px-6 py-2 rounded-lg"
              }
              onClick={() => {
                Swal.fire({
                  title: "Are you sure?",
                  html: `You are deleting the option "${params.row.name}".\nThis will also delete any associated (un-purchased) stock!`,
                  icon: "warning",
                  showCancelButton: true,
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    axios
                      .post(`/api/products/update/options/remove/`, {
                        productId: productData?._id.toString(),
                        optionId: params.row._id.toString(),
                      })
                      .then(async (res) => {
                        router.push(
                          `/admin/products/${productData._id}?info=${
                            -res?.data?.message ||
                            "Successfully deleted option!"
                          }`
                        );
                      })
                      .catch((eX) => {
                        error(eX);
                        snackbar.enqueueSnackbar(
                          `An error occurred while deleting the option ${params.row.name}`,
                          {
                            variant: "error",
                          }
                        );
                      });
                  }
                });
              }}
              color={"red"}
            >
              Delete
            </div>
          </div>
        );
      },
    },
  ];
  return (
    <>
      <AdminNavProvider session={session}>
        <RequireRole admin>
          {inf && (
            <Alert
              type={"info"}
              dismissible
              onDismiss={(e) => {
                setInfo("");
              }}
            >
              {inf}
            </Alert>
          )}
          {err && (
            <Alert
              type={"error"}
              dismissible
              onDismiss={(e) => {
                setError("");
              }}
            >
              {err}
            </Alert>
          )}
          {productData && (
            <>
              <div className="text-white text-xl">
                <p className="font-bold text-3xl">{productData.name}</p>
                <p className="inline-block mr-2.5 text-xl">
                  {stock} total in stock
                </p>
                ·
                <p className="inline-block mx-2.5 text-xl">
                  {productData.timesBought} Units Sold
                </p>
              </div>
              <Grid container spacing={2}>
                <Grid container item rowSpacing={2} xs={12} md={8}>
                  <Grid item xs={12}>
                    <Card>
                      <div>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Product Options
                        </h1>
                      </div>

                      {productData?.options?.length > 0 ? (
                        <>
                          <div
                            style={{
                              height: 400,
                              width: "100%",
                              overflow: "auto",
                            }}
                            className="hide-scrollbar"
                          >
                            <DataGridPro
                              className={"mt-4"}
                              columns={columns}
                              getRowId={(row) => row._id}
                              rows={productData.options}
                              disableColumnFilter
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-white">No options found</p>
                        </>
                      )}
                      <FormButton
                        style={"mt-4"}
                        href={`/admin/products/${productData._id}/options/new/`}
                      >
                        Add
                      </FormButton>
                    </Card>
                  </Grid>
                  <RequireRole admin>
                    <Grid item xs={12}>
                      <Card>
                        <div className={"pb-4"}>
                          <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                            Description
                          </h1>
                          <span>
                            The preview shown here may be inconsistent with the
                            actual product page.
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                          }}
                        >
                          <MarkdownEditor
                            value={description}
                            onChange={(content: string) => {
                              setDescription(content);
                            }}
                          />
                        </div>
                        <FormButton
                          style={"mt-4"}
                          onClickLoading={() => {
                            return axios
                              .post("/api/products/update/description/", {
                                id: productData?._id,
                                description,
                              })
                              .then((res) => {
                                setInfo(res.data.message);
                                snackbar.enqueueSnackbar(res.data.message, {
                                  variant: "success",
                                });
                              })
                              .catch((errorRes) => {
                                error(errorRes);
                                if (errorRes?.response?.data?.message)
                                  setError(errorRes.response.data.message);
                                else setError(`An error occurred!`);
                              });
                          }}
                        >
                          Save
                        </FormButton>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Hold Orders
                        </h1>
                        <span className="text-white">
                          This will hold all completed orders for manual review.
                          (Except verified users) - This will override options
                        </span>
                        <span
                          className={`flex justify-center text-xl text-${
                            productData.holdAllOrders ? "green" : "red"
                          }-500 pb-4`}
                        >
                          {productData.holdAllOrders ? "On" : "Off"}
                        </span>
                        <FormButton
                          onClickLoading={() => {
                            return axios
                              .post(`/api/products/update/hold/`, {
                                id: productData._id,
                                hold: !productData.holdAllOrders,
                              })
                              .then((res) => {
                                if (res.data.success) {
                                  setInfo(res.data.message);
                                  productData.holdAllOrders =
                                    !productData.holdAllOrders;
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
                          color={productData.holdAllOrders ? "red" : "green"}
                        >
                          {productData.holdAllOrders ? "Disable" : "Enable"}
                        </FormButton>
                      </Card>
                    </Grid>
                  </RequireRole>
                  <Grid item xs={12}>
                    <Card>
                      <div>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                          Notes
                        </h1>
                        <div className="flex flex-col items-center pt-3">
                          <TextField
                            id="note"
                            label="Note"
                            variant="outlined"
                            multiline
                            rows={8}
                            sx={{
                              width: "100%",
                            }}
                            value={note || ""}
                            onChange={(e) => {
                              setNote(e.target.value);
                            }}
                          />
                          <FormButton
                            className={"mt-4"}
                            onClick={(e) => {
                              axios
                                .post("/api/products/update/note/", {
                                  id: productData._id.toString(),
                                  note,
                                })
                                .then((res) => {
                                  if (res.data.success) {
                                    snackbar.enqueueSnackbar(res.data.message, {
                                      variant: "success",
                                    });
                                  } else {
                                    setError(res.data.message);
                                    snackbar.enqueueSnackbar(res.data.message, {
                                      variant: "error",
                                    });
                                  }
                                })
                                .catch((eX) => {
                                  const msg =
                                    eX?.response?.data?.message || eX.message;
                                  setError(msg);
                                  snackbar.enqueueSnackbar(msg, {
                                    variant: "error",
                                  });
                                });
                            }}
                          >
                            Save
                          </FormButton>
                        </div>
                      </div>
                    </Card>
                  </Grid>
                  <StockCheckerSettings product={productData} />
                </Grid>
                <RequireRole admin>
                  <Grid container item xs={12} md={4}>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Name
                        </h1>
                        <form className="space-y-4 md:space-y-6">
                          <div className={"pt-4"}>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              defaultValue={productData.name}
                              className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              placeholder={productData.name}
                              required={true}
                            ></input>
                          </div>
                          <FormButton
                            type={"submit"}
                            onClickLoading={(e) => {
                              e.preventDefault();
                              // const name = e.target.name.value;
                              const name =
                                (
                                  document.getElementById(
                                    "name"
                                  ) as HTMLInputElement
                                )?.value || "No Name";
                              return axios
                                .post("/api/products/update/name/", {
                                  id: productData?._id,
                                  name,
                                })
                                .then((res) => {
                                  // setInfo(res.data.message);
                                  setInfo(res.data.message);
                                  router.push(router.asPath);
                                  snackbar.enqueueSnackbar(res.data.message, {
                                    variant: "success",
                                  });
                                })
                                .catch((errorRes) => {
                                  error(errorRes);
                                  setError(
                                    errorRes?.response?.data?.message ||
                                      "An error occurred!"
                                  );
                                  Swal.fire({
                                    title: "Could not save changes for name",
                                    text:
                                      errorRes?.response?.data?.message ||
                                      "An error occurred!",
                                    icon: "error",
                                  });
                                });
                            }}
                          >
                            Update Name
                          </FormButton>
                        </form>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Category
                        </h1>
                        <form className="">
                          <div className="flex flex-col items-center py-3">
                            <select
                              id={"select-sort-behavior"}
                              className="w-full hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"
                              defaultValue={
                                productData.category
                                  ? productData.category._id
                                  : undefined
                              }
                              name={"category"}
                            >
                              <option
                                disabled={true}
                                selected={!productData.category}
                              >
                                No category selected
                              </option>
                              {categories.map((option: any) => {
                                return (
                                  <option key={option._id} value={option._id}>
                                    {option.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <FormButton
                            type={"submit"}
                            onClickLoading={(e) => {
                              e.preventDefault();
                              return axios
                                .post(`/api/products/${productData?._id}/`, {
                                  category: (
                                    document.querySelector(
                                      '[name="category"]'
                                    ) as HTMLInputElement
                                  )?.value,
                                })
                                .then((res) => {
                                  // setInfo(res.data.message);
                                  router.replace(router.asPath);
                                })
                                .catch((errorRes) => {
                                  error(errorRes);
                                  setError(
                                    errorRes?.response?.data?.message ||
                                      "An error occurred!"
                                  );
                                });
                            }}
                          >
                            Update Category
                          </FormButton>
                        </form>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Sort
                        </h1>
                        <form className="">
                          <div className="flex flex-col items-center py-3">
                            <select
                              id={"select-sort-behavior"}
                              className="w-full hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"
                              defaultValue={productData.sort}
                            >
                              {[
                                {
                                  value: "alphabetical",
                                  label: "Alphabetical",
                                },
                                {
                                  value: "value",
                                  label: "Value",
                                },
                                {
                                  value: "none",
                                  label: "None",
                                },
                              ].map((option) => {
                                return (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <FormButton
                            type={"submit"}
                            onClickLoading={(e) => {
                              e.preventDefault();
                              const sort = (
                                document.getElementById(
                                  "select-sort-behavior"
                                ) as HTMLInputElement
                              )?.value;
                              return axios
                                .post("/api/products/update/sort/", {
                                  id: productData?._id,
                                  sort,
                                })
                                .then((res) => {
                                  setInfo(res.data.message);
                                  snackbar.enqueueSnackbar(res.data.message, {
                                    variant: "success",
                                  });
                                  router.push(router.asPath);
                                })
                                .catch((errorRes) => {
                                  error(errorRes);
                                  Swal.fire({
                                    title: "Could not save changes",
                                    text:
                                      errorRes?.response?.data?.message ||
                                      "An error occurred!",
                                    icon: "error",
                                  });
                                  setError(
                                    errorRes?.response?.data?.message ||
                                      "An error occurred!"
                                  );
                                });
                            }}
                          >
                            Update Sort
                          </FormButton>
                        </form>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Short Description
                        </h1>
                        <form className="space-y-4 md:space-y-6">
                          <div className={"pt-4"}>
                            <input
                              type="text"
                              name="shortDesc"
                              id="shortDesc"
                              defaultValue={productData.shortDescription}
                              className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              placeholder={productData.shortDescription}
                              required={true}
                            ></input>
                          </div>
                          <FormButton
                            type={"submit"}
                            onClickLoading={(e) => {
                              e.preventDefault();
                              const shortDesc =
                                (
                                  document.getElementById(
                                    "shortDesc"
                                  ) as HTMLInputElement
                                )?.value || "";
                              return axios
                                .post(
                                  "/api/products/update/description?short=true",
                                  {
                                    id: productData?._id,
                                    description: shortDesc,
                                  }
                                )
                                .then((res) => {
                                  setInfo(res.data.message);
                                  snackbar.enqueueSnackbar(res.data.message, {
                                    variant: "success",
                                  });
                                })
                                .catch((errorRes) => {
                                  error(errorRes);
                                });
                            }}
                          >
                            Update Short Description
                          </FormButton>
                        </form>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Warranty
                        </h1>
                        <div className={"pt-4 space-y-4 md:space-y-2"}>
                          <label htmlFor={"warrantyHrs"}>Maximum Order</label>
                          <input
                            type="number"
                            name="warrantyHrs"
                            placeholder={"50"}
                            value={maximum}
                            onChange={(e) => setMaximum(e.target.value)}
                            id="warrantyHrs"
                            className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                            required={true}
                          />
                        </div>
                        <div className={"pt-4 mb-6"}>
                          <label className={"mb-4"} htmlFor={"warrantyHrs"}>
                            Minimum Order
                          </label>
                          <input
                            type="number"
                            className="outline-none mt-3 hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300"
                            placeholder={"10"}
                            value={minimum}
                            onChange={(e) => setMinimum(e.target.value)}
                            required={true}
                          />
                        </div>
                        <FormButton
                          type={"submit"}
                          onClick={() =>
                            update({
                              maximum: maximum ? parseInt(maximum) : null,
                              minimum: minimum ? parseInt(minimum) : null,
                            })
                          }
                        >
                          Save Changes
                        </FormButton>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Warranty
                        </h1>
                        <form className="space-y-4 md:space-y-6">
                          <div className={"pt-4"}>
                            <label htmlFor={"warrantyHrs"}>
                              Warranty Hours
                            </label>
                            <input
                              type="number"
                              name="warrantyHrs"
                              id="warrantyHrs"
                              className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              placeholder={productData.warrantyHours}
                              defaultValue={productData.warrantyHours}
                              required={true}
                            />
                          </div>
                          <div>
                            <FormControlLabel
                              control={
                                <Switch
                                  defaultChecked={productData.warrantyEnabled}
                                  onChange={() => {
                                    axios
                                      .post(
                                        `/api/products/update/warrantyToggle`,
                                        {
                                          id: productData._id,
                                          warranty:
                                            !productData.warrantyEnabled,
                                        }
                                      )
                                      .then((res) => {
                                        if (res.data.success) {
                                          setInfo(res.data.message);
                                          snackbar.enqueueSnackbar(
                                            res.data.message,
                                            {
                                              variant: "success",
                                            }
                                          );
                                          router.push(router.asPath);
                                        } else {
                                          setError(res.data.message);
                                        }
                                      })
                                      .catch((errorRes) => {
                                        error(errorRes);
                                        if (errorRes?.response?.data?.message)
                                          setError(
                                            errorRes.response.data.message
                                          );
                                        else setError(`An error occurred!`);
                                      });
                                  }}
                                />
                              }
                              label="Enable Warranty"
                            />
                          </div>
                          <FormButton
                            type={"submit"}
                            onClickLoading={(e) => {
                              e.preventDefault();
                              /*
                            const warranty = parseInt(
                              e.target.warrantyHrs.value,
                              10
                            );
                             */
                              const warranty = parseInt(
                                (
                                  document.getElementById(
                                    "warrantyHrs"
                                  ) as HTMLInputElement
                                )?.value || "0",
                                10
                              );
                              return axios
                                .post("/api/products/update/warranty/", {
                                  id: productData?._id,
                                  warranty,
                                })
                                .then((res) => {
                                  if (res.data.success) {
                                    setInfo(res.data.message);
                                    router.push(router.asPath);
                                  } else {
                                    setError(res.data.message);
                                  }
                                })
                                .catch((errorRes) => {
                                  error(errorRes);
                                });
                            }}
                          >
                            Update Warranty
                          </FormButton>
                        </form>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Image
                        </h1>
                        <form
                          className="space-y-4 md:space-y-6"
                          onSubmit={updateImage}
                        >
                          <div className={"pt-4"}>
                            <div>
                              <label
                                htmlFor="image"
                                className="block mb-2 text-sm font-medium text-white"
                              >
                                Image
                              </label>
                              <input
                                type="file"
                                name="image"
                                id="image"
                                placeholder="1"
                                className="hover-circle file-upload-input rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300"
                                accept="image/*"
                              ></input>
                            </div>
                            <div className={"pt-4"}>
                              <label
                                htmlFor="imageUrl"
                                className="block mb-2 text-sm font-medium text-white"
                              >
                                Image URL
                              </label>
                              <input
                                type="text"
                                name="imageUrl"
                                id="imageUrl"
                                placeholder="https://example.com/picture.png"
                                defaultValue={productData.image}
                                className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              ></input>
                            </div>
                          </div>
                          <FormButton type={"submit"}>Update Image</FormButton>
                        </form>
                      </Card>
                    </Grid>
                    {/* <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Banner Image
                        </h1>
                        <form
                          className="space-y-4 md:space-y-6"
                          onSubmit={updateBannerImage}
                        >
                          <div className={"pt-4"}>
                            <div>
                              <label
                                htmlFor="bannerImage"
                                className="block mb-2 text-sm font-medium text-white"
                              >
                                Banner Image
                              </label>
                              <input
                                type="file"
                                name="image"
                                id="bannerImage"
                                placeholder="1"
                                className="hover-circle file-upload-input rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300"
                              ></input>
                            </div>
                            <div className={"pt-4"}>
                              <label
                                htmlFor="bannerImageUrl"
                                className="block mb-2 text-sm font-medium text-white"
                              >
                                Image URL
                              </label>
                              <input
                                type="text"
                                name="bannerImageUrl"
                                id="bannerImageUrl"
                                placeholder="https://example.com/picture.png"
                                defaultValue={productData.bannerImage}
                                className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              ></input>
                            </div>
                          </div>
                          <div>
                            <FormControlLabel
                              control={
                                <Switch
                                  defaultChecked={productData.fitBanner}
                                  onChange={() => {
                                    axios
                                      .post(`/api/products/update/fitBanner`, {
                                        id: productData._id,
                                        fitBanner: !productData.fitBanner,
                                      })
                                      .then(async (res) => {
                                        infoLog(res);
                                        if (res.data.success) {
                                          await router.push(
                                            `/admin/products/${productData._id}?info=Successfully updated fit banner image`
                                          );
                                        } else {
                                          setError(res.data.error);
                                        }
                                      })
                                      .catch((eX) => {
                                        error(eX);
                                        if (eX.response?.data?.message) {
                                          setError(eX.response.data.message);
                                        } else {
                                          setError("An error occurred");
                                        }
                                      });
                                  }}
                                />
                              }
                              label="Attempt to fit banner image"
                            />
                          </div>
                          <FormButton type={"submit"}>
                            Update Banner Image
                          </FormButton>
                        </form>
                      </Card>
                    </Grid> */}
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          {productData.hidden ? "Hidden" : "Shown"}
                        </h1>
                        <FormButton
                          type={"submit"}
                          className={"mt-2"}
                          onClickLoading={() => {
                            return axios
                              .post("/api/products/update/hidden", {
                                id: productData._id,
                                hidden: !productData.hidden,
                              })
                              .then((res) => {
                                infoLog(res);
                                if (res.data.success) {
                                  setInfo(res.data.message);
                                  router.push(router.asPath);
                                } else {
                                  setError(res.data.message);
                                }
                              })
                              .catch((eX) => {
                                error(eX);
                                if (eX?.response?.data?.message)
                                  setError(eX.response.data.message);
                                else setError(`An error occurred!`);
                              });
                          }}
                        >
                          {productData.hidden ? "Unhide" : "Hide"}
                        </FormButton>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                          Delete
                        </h1>
                        <FormButton
                          color={"red"}
                          type={"submit"}
                          className={"mt-2"}
                          onClick={() => {
                            Swal.fire({
                              title: "Are you sure?",
                              html: `You are deleting the product "${productData.name}".\nThis will also delete any (un-purchased) associated stock & options!`,
                              icon: "warning",
                              showCancelButton: true,
                            }).then((result) => {
                              if (result.isConfirmed) {
                                axios
                                  .post("/api/products/delete", {
                                    id: productData._id.toString(),
                                  })
                                  .then((res) => {
                                    if (res.data.success) {
                                      snackbar.enqueueSnackbar(
                                        res.data.message,
                                        {
                                          variant: "success",
                                        }
                                      );
                                      router.push(router.asPath);
                                    } else {
                                      Swal.fire({
                                        title: "Error!",
                                        text: res.data.message,
                                        icon: "error",
                                      });
                                    }
                                  })
                                  .catch((eX) => {
                                    Swal.fire({
                                      title: "Error!",
                                      text: eX.message,
                                      icon: "error",
                                    });
                                  });
                              }
                            });
                          }}
                        >
                          Delete Product
                        </FormButton>
                      </Card>
                    </Grid>
                  </Grid>
                </RequireRole>
              </Grid>
              <a href={`/admin/products/`}>
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

export default ProductPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { info, productId } = context.query;
  const err = context.query.error;
  const ProductModel = await getProductModel();
  const data: any = await ProductModel.findById(productId as string);
  if (!data) {
    return {
      notFound: true,
    };
  }
  const jsonData = JSON.parse(JSON.stringify(data));
  const promises = jsonData.options.map(async (option: any) => {
    // TODO move this code into a util function, it's *somewhat* duplicated in multiple places (admin/products)
    option.stock = await getStockManager().getStockAmount(
      productId as string,
      option._id.toString() as string
    );
    return option;
  });
  jsonData.options = await Promise.all(promises);
  const stock = await getStockManager().getStockAmountProduct(
    productId as string
  );

  const category = await getProductCategoryModel();
  const categories = await category.find().lean().exec();
  return {
    props: {
      success: true,
      message: "",
      errAlert: err || "",
      infAlert: info || "",
      productData: jsonData,
      stock,
      categories: JSON.parse(JSON.stringify(categories)),
    },
  };
}
