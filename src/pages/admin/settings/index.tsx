import React, { useCallback, useEffect, useState } from "react";

import {
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  TextField,
  useTheme,
} from "@mui/material";
import axios from "axios";
import update from "immutability-helper";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { DndProvider } from "react-dnd-multi-backend";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";

import {
  FullProductInterfaceWithOption,
  getFullProductWithOptionsDefaultArr,
} from "@app-types/models/product";
import AdminNavProvider from "@components/admin/AdminNavProvider";
import { AdminProductCard } from "@components/admin/AdminProductCard";
import Modal, { ModalButton } from "@components/admin/Modal";
import Alert from "@components/Alert";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import getProductModel from "@models/product";
import getSettingsModel from "@models/settings";
import { DisplayBehavior } from "@src/types";
import { setSettingClient } from "@util/ClientUtils";
import { getPrice } from "@util/EasterEgg";
import { error as errorLog } from "@util/log";
import { getSetting } from "@util/SettingsHelper";
import RequireRole from "@components/auth/RequireRole";
import { useSnackbar } from "notistack";
import { currency } from "@root/currency";
import { useRouter } from "next/router";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
function getStyles(name: string, productName: any, theme: any) {
  return {
    fontWeight:
      productName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}
function AddProductModal(props: AddProductModalProps) {
  const [error, setError] = useState<string>("");
  const theme = useTheme();
  const [productsName, setProductsName] = React.useState<any>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<string>();
  const [selectAll, setSelectAll] = React.useState<boolean>(false);
  const [discountCode, setdiscountCode] = React.useState<string>("");
  const [discountValue, setdiscountValue] = React.useState<string>("");
  const [index, setIndex] = React.useState<number>();
  const [featuredProduct, setFeaturedProduct] = useState("");
  const snackbar = useSnackbar();
  const router = useRouter();
  const handleChange = (event: any) => {
    const {
      target: { value },
    } = event;

    if (value.includes("Select All")) {
      if (selectAll) {
        const nonExistingProducts = props.products.filter(
          (product) => product && product.options.length > 0
        );

        setProductsName([...nonExistingProducts.map((data) => data.id)]);
      } else if (!selectAll) {
        setProductsName([]);
      } else {
        setProductsName([]);
        setProductsName(
          // On autofill we get a stringified value.
          typeof value === "string" ? value.split(",") : value
        );
      }
    } else {
      // Remove "Select All" if it was previously selected
      const filteredValues = value.filter((val: any) => val !== "Select All");
      setProductsName(filteredValues);
    }
    // Remove "Select All" if it was previously selected
  };
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
  };
  const handlePaymentMethodChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setPaymentMethod(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };


  return (
    <>
      <Modal
        id={props.id}
        title={
          props.discount ? "Add Discount Products" : "Add Featured Products"
        }
        description={""}
        buttons={
          <div className="flex items-center gap-2">
            <button
              className="bg-[#303633] scale-100 delay-100 transition text-sm text-center py-[7px] px-3 hover:bg-[#4A524E] w-[49%] font-bold rounded-md"
              onClick={() => {
                document.getElementById(props.id)?.classList.add("hidden");
              }}
            >
              Cancel
            </button>
            <div>
              <FormButton
                className="px-6"
                onClick={() => {
                  if (props.discount) {
                    const selected = document.getElementById(
                      props.productId
                    ) as HTMLSelectElement;
                    setError("");
                    // const discountValue = document.getElementById(
                    //   "discount-value"
                    // ) as HTMLSelectElement;
                    // const discountCode = document.getElementById(
                    //   "discount-code"
                    // ) as HTMLSelectElement;
                    // const selectedId = selected?.value;
                    if (
                      productsName?.length === 0 ||
                      paymentMethod?.length === 0 ||
                      discountCode === "" ||
                      discountValue === ""
                    ) {
                      setError("Please fill all fields");
                      snackbar.enqueueSnackbar("Please fill all fields", {
                        variant: "error",
                      });
                      return;
                    }
                    const existing = props.currentProducts.some((item: any) =>
                      item.products.some((product: any) =>
                        productsName.includes(product.id)
                      )
                    );

                    // const disabled: boolean = !!existing;
                    // if (disabled) {
                    //   setError("Product already added");
                    //   snackbar.enqueueSnackbar("Product already added", {
                    //     variant: "error",
                    //   });
                    //   return;
                    // }

                    const productsData = props.products.filter((p) => {
                      return productsName.includes(p.id);
                    });
                    const existingProductIds = props.currentProducts.flatMap(
                      (item: any) =>
                        item.products.map((product: any) => product.id)
                    );

                    // Filter out products from productsData that already exist in different payment methods
                    const uniqueNewProducts = productsData.filter(
                      (product) => !existingProductIds.includes(product)
                    );

                    // Prepare the updated product array by combining existing products and unique new products
                    const updatedProducts = props.currentProducts.map(
                      (item: any) => ({
                        ...item,
                        products: [...item.products, ...uniqueNewProducts],
                      })
                    );

                    // Extract all product IDs from the updated products
                    const allProductIds = updatedProducts.flatMap((item) =>
                      item.products.map((product: any) => product.id)
                    );

                    const newProducts: FullProductInterfaceWithOption[] = [
                      ...allProductIds,
                      ...(productsData as any),
                    ];
                    const allProducts = newProducts.map((p) => p?.id);

                    axios
                      .post("/api/products/discount/set/", {
                        products: allProducts.filter((data) => data && data),
                        discount: discountValue,
                        code: discountCode,
                        paymentMethod: paymentMethod && paymentMethod[0],
                      })
                      .then((res) => {
                        if (res.data.message) {
                          setError("");
                          snackbar.enqueueSnackbar(
                            "Changes successfully added",
                            {
                              variant: "success",
                            }
                          );
                          router.reload();
                        } else {
                          setError(res?.data?.message || "Unknown Error");
                        }
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        if (eX?.response?.data?.message) {
                          snackbar.enqueueSnackbar(
                            eX?.response?.data?.message,
                            {
                              variant: "error",
                            }
                          );
                          setError(eX?.response?.data?.message);
                        } else setError(`An error occurred!`);
                      });
                  }
                  if (props.featured) {
                    const selected = document.getElementById(
                      props.productId
                    ) as HTMLSelectElement;
                    const selectedId = selected?.value;
                    if (featuredProduct === "") {
                      snackbar.enqueueSnackbar(
                        "Please select a product to add",
                        {
                          variant: "error",
                        }
                      );
                      setError("Please select a product to add");
                      return;
                    }
                    const existing = props.currentProducts.find((p) => {
                      return p?.id === selectedId;
                    });
                    const disabled: boolean = !!existing;
                    if (disabled) {
                      snackbar.enqueueSnackbar("Product already added", {
                        variant: "error",
                      });
                      setError("Product already added");
                      return;
                    }
                    const product = props.products.find((p) => {
                      return p?.id === featuredProduct;
                    });

                    const newProducts: FullProductInterfaceWithOption[] = [
                      ...props.currentProducts,
                      product as FullProductInterfaceWithOption,
                    ];
                    const allProducts: string[] = newProducts.map((p) => {
                      return p?.id;
                    });
                    axios
                      .post("/api/products/featured/set/", {
                        products: allProducts,
                      })
                      .then((res) => {
                        if (res?.data?.message) {
                          snackbar.enqueueSnackbar(res?.data?.message, {
                            variant: "success",
                          });
                          router.reload();
                        } else {
                          setError(res?.data?.message || "Unknown Error");
                        }
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        if (eX?.response?.data?.message) {
                          snackbar.enqueueSnackbar(
                            eX?.response?.data?.message,
                            {
                              variant: "error",
                            }
                          );
                          setError(eX.response.data.message);
                        } else setError(`An error occurred!`);
                      });
                  }
                }}
              >
                Add
              </FormButton>
            </div>
          </div>
        }
      >
        <>
          {/* {error && (
            <Alert type={"error"} dismissible style={"mt-2 mb-2"}>
              {error}
            </Alert>
          )} */}
          <label
            htmlFor={props.productId}
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Select a product to add
          </label>
          {props.discount ? (
            <FormControl>
              <InputLabel id="demo-multiple-name-label">
                Choose Products
              </InputLabel>
              <Select
                labelId="demo-multiple-name-label"
                id="demo-multiple-name"
                className="w-[500px] bg-[#1F2421] outline-none border-0 hover:border-none focus:ring-0 placeholder:text-white"
                multiple
                value={productsName}
                onChange={handleChange}
                input={<OutlinedInput label="Choose Products" />}
                MenuProps={MenuProps}
              >
                <MenuItem
                  className="bg-[#141716] hover:bg-white hover:text-black outline-none focus:ring-0"
                  value={"Select All"}
                  onClick={handleSelectAll}
                >
                  Select All
                </MenuItem>
                {props.products.length === 0 ? (
                  <div className="text-white text-center w-full p-3">
                    No products available
                  </div>
                ) : (
                  props.products.map((product: any) => {
                    const existing = props.currentProducts?.some((item: any) =>
                      item.products?.some((p: any) => product.id === p.id)
                    );
                    const hasOptions =
                      product.options && product.options.length > 0;
                    const disabled: boolean = !hasOptions;
                    return (
                      <MenuItem
                        key={product.name}
                        className="bg-[#141716] hover:bg-white hover:text-black hover:font-bold"
                        value={product.id}
                        style={getStyles(product.name, productsName, theme)}
                      >
                        {product.name} - {product.option?.name || "NO OPTION!"}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Choose Products
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id={props.productId}
                  className="w-[500px] bg-[#1F2421] outline-none focus:ring-0 placeholder:text-white"
                  // label="Choose Products"
                  defaultValue={"please-select"}
                  onChange={(e) => setFeaturedProduct(e.target.value)}
                  input={<OutlinedInput label="Choose Products" />}
                  MenuProps={MenuProps}

                  // className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#333440] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  {props.products.map((product) => {
                    const existing = props.currentProducts.find((p) => {
                      return p.id === product.id;
                    });
                    const disabled: boolean = !!existing;
                    return (
                      <MenuItem
                        className="bg-[#141716] hover:bg-white hover:text-black hover:font-bold"
                        value={product.id}
                        key={product.id}
                        disabled={disabled}
                      >
                        {product.name} - {product.option?.name || "NO OPTION!"}{" "}
                        - {getPrice(product.price)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {/* <select
                id={props.productId}
                style={{ width: "100%" }}
                defaultValue={"please-select"}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#333440] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option disabled={true} value={"please-select"}>
                  Choose a product
                </option>
                {props.products.map((product) => {
                  const existing = props.currentProducts.find((p) => {
                    return p.id === product.id;
                  });
                  const disabled: boolean = !!existing;
                  return (
                    <option
                      value={product.id}
                      key={product.id}
                      disabled={disabled}
                    >
                      {product.name} - {product.option?.name || "NO OPTION!"} -{" "}
                      {getPrice(product.price)}
                    </option>
                  );
                })}
              </select> */}
            </>
          )}
          {props.discount && (
            <>
              <div className="mt-5">
                <FormControl>
                  <InputLabel id="demo-simple-select-label">
                    Payment Method
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    className="w-[500px] text-white bg-[#1F2421] outline-none focus:ring-0 placeholder:text-white"
                    input={<OutlinedInput label="Payment Method" />}
                    MenuProps={MenuProps}
                  >
                    {currency.map((currency: any) => {
                      return (
                        <MenuItem
                          value={currency.value}
                          className="bg-[#141716] hover:bg-white hover:text-black hover:font-bold"
                        >
                          {currency.coin}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </div>
              <div className="mt-3">
                <label className="text-sm" htmlFor={"discount-value"}>
                  Discount Value
                </label>
                <input
                  type="number"
                  name="discount-value"
                  id="discount-value"
                  min={0}
                  onChange={(e) => setdiscountValue(e.target.value)}
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-[#1F2421] outline-none focus:ring-0 border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={props.discountValue}
                />
              </div>
              <div className="mt-3">
                <label className="text-sm" htmlFor={"discount-code"}>
                  Discount Code
                </label>
                <input
                  type="text"
                  name="discount-code"
                  onChange={(e) => setdiscountCode(e.target.value)}
                  id="discount-code"
                  defaultValue={props.discountCode}
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-[#1F2421] outline-none focus:ring-0 border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                />
              </div>
            </>
          )}
        </>
      </Modal>
    </>
  );
}

function AddProxyModal(props: any) {
  const [proxy, setProxy] = useState<any>({
    host: "",
    port: null,
    auth: {
      username: "",
      password: "",
    },
  });
  const router = useRouter();
  const theme = useTheme();

  const snackbar = useSnackbar();
  return (
    <>
      <Modal
        id={props.id}
        title={"Add Proxy Details"}
        description={""}
        buttons={
          <>
            <ModalButton
              className="bg-black"
              onClick={() => {
                if (
                  !proxy.host ||
                  !proxy.port ||
                  !proxy.auth.username ||
                  !proxy.auth.password
                ) {
                  // Display an error message or prevent form submission
                  snackbar.enqueueSnackbar(
                    "Please fill in all required fields",
                    {
                      variant: "error",
                    }
                  );
                  return;
                }
                setSettingClient("sellixProxies", [
                  ...props.defaultSellixProxies,
                  proxy,
                ]);
                snackbar.enqueueSnackbar("Changes saved successfully", {
                  variant: "success",
                });
                router.reload();
              }}
            >
              Save
            </ModalButton>
            <ModalButton
              color={"gray"}
              onClick={() => {
                document.getElementById(props.id)?.classList.add("hidden");
              }}
            >
              Cancel
            </ModalButton>
          </>
        }
      >
        <label
          htmlFor={props.productId}
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Select a product to add
        </label>
        <div className="mt-3">
          <label htmlFor={"Host"}>Host</label>
          <input
            type="text"
            placeholder="@ip"
            name="host"
            id="host"
            onChange={(e) => setProxy({ ...proxy, host: e.target.value })}
            className="outline-none sm:w-[500px] hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-600 text-white focus:border-[#FFFFFF] duration-150"
            required={true}
          />
        </div>
        <div className="mt-3">
          <label htmlFor={"Port"}>Port</label>
          <input
            type="number"
            name="port"
            placeholder="8000"
            onChange={(e) => setProxy({ ...proxy, port: e.target.value })}
            id="port"
            className="outline-none sm:w-[500px] hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
            required={true}
          />
        </div>
        <div className="mt-3">
          <label htmlFor={"Username"}>Username</label>
          <input
            type="text"
            name="username"
            onChange={(e) =>
              setProxy({
                ...proxy,
                auth: { ...proxy.auth, username: e.target.value },
              })
            }
            autoComplete="off"
            id="username"
            placeholder="@example"
            className="outline-none sm:w-[500px] hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
            required={true}
          />
        </div>
        <div className="mt-3">
          <label htmlFor={"Password"}>Password</label>
          <input
            type="password"
            placeholder="********"
            name="password"
            onChange={(e) =>
              setProxy({
                ...proxy,
                auth: { ...proxy.auth, password: e.target.value },
              })
            }
            id="password"
            className="outline-none sm:w-[500px] hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
            required={true}
          />
        </div>
      </Modal>
    </>
  );
}

const Index = ({
  infAlert,
  errAlert,
  featuredProducts,
  discountProducts,
  allProducts,
  defaultGuestOrders,
  defaultShowCrisp,
  defaultShowSupport,
  cashAppAdjustment,
  defaultProxies,
  defaultSellixProxies,
  enableCashApp,
  discountCode,
  discountValue,
  cashTag,
  cashAppQrCodeUrl,
  enableCashAppReceiptCheckingDef,
  receiptCheckingProxyDef,
  supportLinkDef,
  defaultSmtpCreds,
  defaultOutOfStockWebhookUrl,
  defaultOrderVerificationWebhookUrl,
  ...props
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [inf, setInfo] = useState<string>(infAlert as string);
  const [err, setError] = useState<string>(errAlert as string);
  const [cashAppEnabled, setCashAppEnabled] = useState<boolean>(
    enableCashApp as boolean
  );
  const [proxies, setProxies] = useState<string>(defaultProxies);
  const [sellixProxies, setSellixProxies] = useState<string[]>(
    defaultSellixProxies || []
  );
  const [smtpCreds, setSmtpCreds] = useState<string>(defaultSmtpCreds);
  const session = useSession();
  const snackbar = useSnackbar();
  const router = useRouter();
  const [featured, setFeatured] =
    useState<FullProductInterfaceWithOption[]>(featuredProducts);
  const [discount, setDiscount] = useState<FullProductInterfaceWithOption[]>();
  const [guestOrders, setGuestOrders] = useState<boolean>(defaultGuestOrders);
  const [mounted, setMounted] = useState<boolean>(false);
  const [showCrisp, setShowCrisp] = useState<DisplayBehavior>(defaultShowCrisp);
  const [showSupport, setShowSupport] =
    useState<DisplayBehavior>(defaultShowSupport);
  const [cashAppReceiptCheck, setCashAppReceiptCheck] = useState<boolean>(
    enableCashAppReceiptCheckingDef
  );
  const [receiptCheckingProxy, setReceiptCheckingProxy] = useState<boolean>(
    receiptCheckingProxyDef
  );

  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setFeatured((prevCards: FullProductInterfaceWithOption[]) =>
      update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [
            hoverIndex,
            0,
            prevCards[dragIndex] as FullProductInterfaceWithOption,
          ],
        ],
      })
    );
  }, []);
  useEffect(() => {
    setDiscount(discountProducts);
  }, [mounted]);
  const renderCard = useCallback(
    (card: FullProductInterfaceWithOption, index: number) => {
      return (
        <>
          <AdminProductCard
            key={card.id}
            index={index}
            id={card.id}
            product={card}
            moveCard={moveCard}
            onDeleted={(id) => {
              setFeatured((prevCards: FullProductInterfaceWithOption[]) => {
                return prevCards.filter((p) => p.id !== id);
              });
            }}
          />
        </>
      );
    },
    []
  );

  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        <Meta
          title={`Settings - Page 1`}
          description={"View or change site settings"}
        />
        <AddProductModal
          id={"add-discount-product-modal"}
          productId={"discount-products"}
          selectedValue={"please-select-discount-product"}
          discount={true}
          featured={false}
          products={allProducts}
          currentProducts={discount as any}
          discountCode={discountCode}
          discountValue={discountValue}
        />
        <AddProductModal
          id={"add-product-modal"}
          productId={"featured-products"}
          selectedValue={"please-select-featured-product"}
          discount={false}
          featured={true}
          products={allProducts}
          currentProducts={featured}
          discountCode={discountCode}
          discountValue={discountValue}
        />

        <div className={"flex w-full items-center"}>
          <div className="ml-auto">
            <FormButton disabled>
              <FaChevronLeft />
            </FormButton>
          </div>
          <h1 className={"text-2xl flex-grow text-center"}>Settings</h1>
          <div className="ml-auto">
            <FormButton href={"/admin/settings/2"}>
              <FaChevronRight />
            </FormButton>
          </div>
        </div>
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

        <AddProxyModal defaultSellixProxies={sellixProxies} id="proxy-modal" />
        <Grid container spacing={2} className="mb-[15px] pt-4">
          <Grid item md={4} xs={12}>
            <Card width={"50"}>
              <h1 className="text-xl pb-1 font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Featured products
              </h1>
              <DndProvider options={HTML5toTouch}>
                <div className="lg:h-[130px] overflow-y-auto">
                  {featured.map((c, i) => renderCard(c, i))}
                </div>
              </DndProvider>
              <div className="mt-2">
                <FormButton
                  onClickLoading={() => {
                    const allProductsStr: string[] = featured.map((p) => {
                      return p.id;
                    });
                    return axios
                      .post("/api/products/featured/set/", {
                        products: allProductsStr,
                      })
                      .then((res) => {
                        if (res?.data?.success) {
                          window.location.href =
                            "/admin/settings?info=Successfully Updated Featured Products";
                        } else {
                          setError(res?.data?.message || "Unknown Error");
                        }
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        if (eX?.response?.data?.message)
                          setError(eX.response.data.message);
                        else setError(`An error occurred!`);
                      });
                  }}
                >
                  Save
                </FormButton>
                <FormButton
                  style={"mt-2"}
                  onClick={() => {
                    document
                      .getElementById("add-product-modal")
                      ?.classList.remove("hidden");
                  }}
                >
                  Add
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card width={"50"}>
              <h1 className="text-xl pb-1 font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Discount Products
              </h1>
              {/* <DndProvider options={HTML5toTouch}>*/}
              <div className="lg:h-[165px] overflow-y-auto">
                {discount &&
                  discount.map((items: any) => (
                    <div className="border p-2 rounded-lg mb-2">
                      <div className="flex items-center mb-2 justify-between">
                        <p className="text-sm">
                          Method:{" "}
                          <u>
                            {items.paymentMethod.charAt(0).toUpperCase() +
                              items.paymentMethod.slice(1)}
                          </u>
                        </p>
                        <p className="text-sm">
                          Promo: <u>{items.discountCode}</u>
                        </p>
                        <p className="text-sm">
                          Discount: <u>{items.discountValue}%</u>
                        </p>
                      </div>
                      <p className="font-bold">Product list</p>
                      {items.products?.map((c: any, i: number) => (
                        <>
                          <div className="flex py-1 items-center justify-between">
                            <div>
                              <p className="text-sm ml-3">
                                {c.name} ${c?.option.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              className="text-sm px-3"
                              onClick={() => {
                                axios
                                  .post("/api/products/discount/remove/", {
                                    productId: c._id,
                                    paymentMethod: items.paymentMethod,
                                  })
                                  .then((res) => {
                                    setMounted(true);
                                    if (res?.data?.success) {
                                      router.reload();
                                    }
                                  });
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                color="white"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </>
                      ))}
                    </div>
                  ))}
              </div>
              {/* </DndProvider> */}
              <div className="mt-2">
                {/* <FormButton
                  onClickLoading={(e) => {
                    e.preventDefault();
                    const allProductsStr =
                      discount &&
                      discount.map((p) => {
                        return p.id;
                      });
                    return axios
                      .post("/api/products/discount/set", {
                        products: allProductsStr,
                      })
                      .then((res) => {
                        if (res?.data?.success) {
                          console.log(res?.data?.success);

                          // window.location.href =
                          //   "/admin/settings?info=Successfully Updated Featured Products";
                        } else {
                          setError(res?.data?.message || "Unknown Error");
                        }
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        if (eX?.response?.data?.message)
                          setError(eX.response.data.message);
                        else setError(`An error occurred!`);
                      });
                  }}
                >
                  Save
                </FormButton> */}
                <FormButton
                  style={"mt-2"}
                  onClick={() => {
                    document
                      .getElementById("add-discount-product-modal")
                      ?.classList.remove("hidden");
                  }}
                >
                  Add new
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Clear Metrics Database
              </h1>
              <p className="text-white">
                This will clear all metrics data from the database. This is
                irreversible.
              </p>
              <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                <FormButton
                  onClickLoading={() => {
                    return new Promise<void>(async (resolve) => {
                      Swal.fire({
                        title: "Are you sure?",
                        text: "This will clear all metrics data from the database.",
                        icon: "warning",
                        showCancelButton: true,
                      }).then((result) => {
                        if (result.isConfirmed) {
                          axios
                            .post("/api/admin/metrics/deletedb/")
                            .then((res) => {
                              if (res.data.success) {
                                snackbar.enqueueSnackbar(res.data.message, {
                                  variant: "success",
                                });
                              } else {
                                Swal.fire({
                                  title: "Error",
                                  text: res?.data?.message || "Unknown Error",
                                  icon: "error",
                                });
                              }
                            })
                            .catch((eX) => {
                              Swal.fire({
                                title: "Error",
                                text:
                                  eX?.response?.data?.message ||
                                  "Unknown Error",
                                icon: "error",
                              });
                            })
                            .finally(resolve);
                        } else resolve();
                      });
                    });
                  }}
                  color={"red"}
                  className={"mt-4"}
                >
                  Clear Metrics
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Remove unpaid orders
              </h1>
              <p className="text-white">
                This will remove all unpaid orders from the database. This is
                irreversible.
              </p>
              <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                <FormButton
                  onClick={() => {
                    Swal.fire({
                      title: "Are you sure?",
                      text: "This will remove all unpaid orders.",
                      icon: "warning",
                      showCancelButton: true,
                    }).then((result) => {
                      if (result.isConfirmed) {
                        axios
                          .post("/api/orders/pending/remove/")
                          .then((res) => {
                            if (res.data.success) {
                              snackbar.enqueueSnackbar(
                                res.data.message || "Successfully removed data",
                                {
                                  variant: "success",
                                }
                              );
                            } else {
                              Swal.fire({
                                title: "Error",
                                text: res?.data?.message || "Unknown Error",
                                icon: "error",
                              });
                            }
                          })
                          .catch((eX) => {
                            Swal.fire({
                              title: "Error",
                              text:
                                eX?.response?.data?.message || "Unknown Error",
                              icon: "error",
                            });
                          });
                      }
                    });
                  }}
                  color={"red"}
                  className={"mt-4"}
                >
                  Remove Unpaid Orders
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Clear ALL Orders
              </h1>
              <p className="text-white">
                This will PERMANENTLY DELETE ALL ORDERS from the database.
                Including any distributed stock. Make sure you have a backup of
                the <span className={"text-gray-500"}>orders</span>, and{" "}
                <span className={"text-gray-500"}>usedstocks</span> collections.
                This will also delete any pending orders, and orders awaiting
                verification.
              </p>
              <FormButton
                onClick={() => {
                  Swal.fire({
                    title: "Confirm Deletion",
                    text: 'Type "delete" to confirm deletion:',
                    input: "text",
                    inputPlaceholder: "Type here...",
                    inputAttributes: {
                      autocapitalize: "off",
                    },
                    confirmButtonText: "Delete",
                    showCancelButton: true,
                    cancelButtonText: "Cancel",
                    showLoaderOnConfirm: true,
                    preConfirm: (inputValue) => {
                      if (inputValue.trim().toLowerCase() !== "delete") {
                        Swal.showValidationMessage(
                          `You need to type "delete" to confirm deletion!`
                        );
                      }
                    },
                    allowOutsideClick: () => !Swal.isLoading(),
                  }).then((result) => {
                    if (result.isConfirmed) {
                      Swal.fire({
                        title: "Please wait...",
                        html: "Deleting orders...",
                        allowOutsideClick: false,
                        didOpen: () => {
                          Swal.showLoading();
                        },
                      });
                      axios
                        .post("/api/orders/cleardb/")
                        .then((res) => {
                          if (res.data.success) {
                            snackbar.enqueueSnackbar(
                              res.data.message || "Successfully removed data!",
                              {
                                variant: "success",
                              }
                            );
                          } else {
                            Swal.fire({
                              title: "Error",
                              text: res?.data?.message || "Unknown Error",
                              icon: "error",
                            });
                          }
                        })
                        .catch((eX) => {
                          Swal.fire({
                            title: "Error",
                            text:
                              eX?.response?.data?.message || "Unknown Error",
                            icon: "error",
                          });
                        });
                    }
                  });
                }}
                color={"red"}
                className={"mt-4"}
              >
                Remove Orders
              </FormButton>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Guest Orders
              </h1>
              <p className="text-white">
                Guest orders are currently{" "}
                {guestOrders ? (
                  <span className={"text-green-500"}>enabled</span>
                ) : (
                  <span className={"text-red-500"}>disabled</span>
                )}
              </p>
              <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                <FormButton
                  onClickLoading={() => {
                    return setSettingClient("guestOrders", !guestOrders)
                      .then(() => {
                        setInfo("Successfully updated guest orders setting");
                        setGuestOrders(!guestOrders);
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  color={guestOrders ? "red" : "green"}
                  className={"mt-4"}
                >
                  {guestOrders ? "Disable" : "Enable"} Guest Orders
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Show Crisp To
              </h1>
              <p className="text-white">
                Crisp is currently{" "}
                <span className={"font-bold"}>
                  {showCrisp === "show-all"
                    ? "shown to guests."
                    : showCrisp === "show-purchased"
                    ? "shown to logged in users who have purchased something."
                    : showCrisp === "never"
                    ? "never shown."
                    : "shown to logged in users."}
                </span>
              </p>
              <div className="flex flex-col items-center py-3">
                <select
                  id={"select-crisp-behavior"}
                  className="w-full hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"
                  defaultValue={showCrisp}
                >
                  <option value={"show-all"}>Show to all</option>
                  <option value={"show-purchased"}>
                    Logged in users who have purchased something
                  </option>
                  <option value={"show-logged-in"}>Logged in users</option>
                  <option value={"never"}>Never</option>
                </select>
              </div>
              <FormButton
                onClickLoading={() => {
                  return setSettingClient(
                    "showCrisp",
                    (
                      document.getElementById(
                        "select-crisp-behavior"
                      ) as HTMLSelectElement
                    ).value
                  )
                    .then(() => {
                      setInfo("Successfully updated crisp behavior");
                      setShowCrisp(
                        (
                          document.getElementById(
                            "select-crisp-behavior"
                          ) as HTMLSelectElement
                        ).value as DisplayBehavior
                      );
                    })
                    .catch((eX) => {
                      errorLog(eX);
                      setError(eX?.response?.data?.message || "Unknown Error");
                    });
                }}
                className={"mt-4"}
              >
                Update Crisp Behavior
              </FormButton>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Crisp Key
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"crisp-key"}>Crisp Key</label>
                <input
                  type="text"
                  name="crisp-key"
                  id="crisp-key"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={props.defaultCrispKey}
                />
                <FormButton
                  onClickLoading={() => {
                    const val = (
                      document.getElementById("crisp-key") as HTMLInputElement
                    ).value;
                    return setSettingClient("crispKey", val)
                      .then(() => {
                        setInfo("Successfully updated crisp key");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update Crisp Key
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Show Support Button To
              </h1>
              <p className="text-white">
                Support is currently{" "}
                <span className={"font-bold"}>
                  {showSupport === "show-all"
                    ? "shown to guests."
                    : showSupport === "show-purchased"
                    ? "shown to logged in users who have purchased something."
                    : showSupport === "never"
                    ? "neveshowCrispr shown."
                    : "shown to logged in users."}
                </span>
              </p>
              <div className="flex flex-col items-center py-3">
                <select
                  id={"select-support-behavior"}
                  className="w-full hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"
                  defaultValue={showSupport}
                >
                  <option value={"show-all"}>Show to all</option>
                  <option value={"show-purchased"}>
                    Logged in users who have purchased something
                  </option>
                  <option value={"show-logged-in"}>Logged in users</option>
                  <option value={"never"}>Never</option>
                </select>
              </div>
              <FormButton
                onClickLoading={() => {
                  return setSettingClient(
                    "showSupport",
                    (
                      document.getElementById(
                        "select-support-behavior"
                      ) as HTMLSelectElement
                    ).value
                  )
                    .then(() => {
                      setInfo("Successfully updated support behavior");
                      setShowSupport(
                        (
                          document.getElementById(
                            "select-support-behavior"
                          ) as HTMLSelectElement
                        ).value as DisplayBehavior
                      );
                    })
                    .catch((eX) => {
                      errorLog(eX);
                      setError(eX?.response?.data?.message || "Unknown Error");
                    });
                }}
                className={"mt-4"}
              >
                Update Support Behavior
              </FormButton>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                CashApp
              </h1>
              <div className={"pt-4 flex-col"}>
                <span className="text-white">
                  Enable/Disable Cashapp Payments
                </span>
                <span
                  className={`flex justify-center text-xl text-${
                    cashAppEnabled ? "green" : "red"
                  }-500 pb-4`}
                >
                  {cashAppEnabled ? "On" : "Off"}
                </span>
                <FormButton
                  onClickLoading={() => {
                    return setSettingClient("enableCashApp", !cashAppEnabled)
                      .then(() => {
                        setInfo("Successfully updated cashapp setting");
                        setCashAppEnabled(!cashAppEnabled);
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  color={cashAppEnabled ? "red" : "green"}
                >
                  {cashAppEnabled ? "Disable" : "Enable"} CashApp
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                CashApp Price Adjustment
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"warrantyHrs"}>Price Adjustment</label>
                <input
                  type="number"
                  name="cashapp_adjustment"
                  id="cashapp_adj"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  placeholder={"100"}
                  defaultValue={cashAppAdjustment}
                />
                <span className={"text-gray-500"}>
                  0 = 0% fee, 10 = 10% fee
                </span>
                <FormButton
                  onClickLoading={() => {
                    const adj = parseInt(
                      (
                        document.getElementById(
                          "cashapp_adj"
                        ) as HTMLInputElement
                      ).value,
                      10
                    );
                    return setSettingClient("cashAppAdjustment", adj)
                      .then(() => {
                        setInfo("Successfully updated cashapp adjustment");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update CashApp Adjustment
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                CashTag
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"cashtag"}>CashTag</label>
                <input
                  type="text"
                  name="cashtag"
                  id="cashtag"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={cashTag}
                />
                <span className={"text-gray-500"}>
                  Note that the cashapp email must be attached to the account as
                  a secondary email.
                </span>
                <FormButton
                  onClickLoading={() => {
                    const cashtag = (
                      document.getElementById("cashtag") as HTMLInputElement
                    ).value;
                    // if it starts with a $, remove it
                    const ct = cashtag.startsWith("$")
                      ? cashtag.substring(1)
                      : cashtag;
                    return setSettingClient("cashTag", ct)
                      .then(() => {
                        setInfo("Successfully updated cashtag!");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update CashTag
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Support Link
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"supportLink"}>Support Link</label>
                <input
                  type="text"
                  name="supportLink"
                  id="supportLink"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={supportLinkDef}
                />
                <span className={"text-gray-500"}>
                  The support link in the nav and footer
                </span>
                <FormButton
                  onClickLoading={() => {
                    const supportLink = (
                      document.getElementById("supportLink") as HTMLInputElement
                    ).value;
                    return setSettingClient("supportLink", supportLink)
                      .then(() => {
                        setInfo("Successfully updated support link!");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update Support Link
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                CashApp QR Code URL
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"qrUrl"}>URL</label>
                <input
                  type="url"
                  name="qrUrl"
                  id="qrUrl"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={cashAppQrCodeUrl}
                />
                <span className={"text-gray-500"}>
                  Set to empty to disable.
                </span>
                <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                  <FormButton
                    onClickLoading={() => {
                      const url = (
                        document.getElementById("qrUrl") as HTMLInputElement
                      ).value;
                      return setSettingClient("cashAppQrCodeUrl", url)
                        .then(() => {
                          setInfo("Successfully updated cashtag!");
                        })
                        .catch((eX) => {
                          errorLog(eX);
                          setError(
                            eX?.response?.data?.message || "Unknown Error"
                          );
                        });
                    }}
                    className={"mt-2"}
                  >
                    Update QR Code
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                CashApp Receipt Checking
              </h1>
              <div className={"pt-4 flex-col"}>
                <span
                  className={`flex justify-center text-xl text-${
                    cashAppReceiptCheck ? "green" : "red"
                  }-500 pb-4`}
                >
                  {cashAppReceiptCheck ? "On" : "Off"}
                </span>
                <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                  <FormButton
                    onClickLoading={() => {
                      return setSettingClient(
                        "cashAppReceiptChecking",
                        !cashAppReceiptCheck
                      )
                        .then(() => {
                          setInfo("Successfully updated receipt check setting");
                          setCashAppReceiptCheck(!cashAppReceiptCheck);
                        })
                        .catch((eX) => {
                          errorLog(eX);
                          setError(
                            eX?.response?.data?.message || "Unknown Error"
                          );
                        });
                    }}
                    color={cashAppReceiptCheck ? "red" : "green"}
                  >
                    {cashAppReceiptCheck ? "Disable" : "Enable"} Receipt
                    Checking
                  </FormButton>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={receiptCheckingProxy}
                        onChange={async () => {
                          await setSettingClient(
                            "receiptCheckingProxy",
                            !receiptCheckingProxy
                          )
                            .then(() => {
                              setInfo(
                                "Successfully updated receipt check setting"
                              );
                            })
                            .catch(() => {
                              setError(
                                "Failed to update receipt check setting"
                              );
                            });
                          setReceiptCheckingProxy(!receiptCheckingProxy);
                        }}
                      />
                    }
                    label="Use Proxy"
                  />
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                API Proxies
              </h1>
              <span className={"text-gray-500"}>
                One proxy per line. Ex: socks://username:password@ip:port
              </span>
              <div className={"pt-4"}>
                <div className="flex flex-col items-center pt-3 hover-circle">
                  <TextField
                    id="proxies"
                    label="Proxies"
                    variant="outlined"
                    multiline
                    rows={4}
                    sx={{
                      width: "100%",
                    }}
                    value={proxies || ""}
                    onChange={(e) => {
                      setProxies(e.target.value);
                    }}
                  />
                  <FormButton
                    className={"mt-4"}
                    onClickLoading={() => {
                      return setSettingClient("proxies", proxies);
                    }}
                  >
                    Save
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Sellix Proxies
              </h1>
              <span className={"text-gray-500"}>
                One proxy per line. Ex: socks://username:password@ip:port
              </span>
              <div className={"pt-4 w-full"}>
                <div className="flex flex-col items-center w-full hover-circle">
                  <div className="max-h-[220px] overflow-auto w-full hide-scrollbar">
                    {sellixProxies &&
                      Array.isArray(sellixProxies) &&
                      sellixProxies.map((data: any, i: number) => (
                        <div className="border flex items-start justify-between rounded-md p-3 mb-2 w-full">
                          <div>
                            <div className="flex gap-2 items-center">
                              <h2>Host:</h2>
                              <p className="underline text-sm">{data?.host}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                              <h2>Port:</h2>
                              <p className="underline text-sm">{data?.port}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                              <h2>Username:</h2>
                              <input
                                value={data?.auth?.username}
                                className="underline outline-none focus:ring-0 bg-transparent text-sm"
                                readOnly
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <h2>Password:</h2>
                              <p className="underline text-sm">
                                {data?.auth?.password}
                              </p>
                            </div>
                          </div>
                          <div>
                            <button
                              className="text-lg"
                              onClick={() => {
                                setSellixProxies((prevProxy) => {
                                  const updatedProxyArray = prevProxy.filter(
                                    (_, index) => index !== i
                                  );
                                  setSettingClient(
                                    "sellixProxies",
                                    updatedProxyArray
                                  );
                                  return updatedProxyArray;
                                });
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                color="white"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <FormButton
                    className={"mt-4"}
                    onClick={() => {
                      // proxy-modal
                      document
                        .getElementById("proxy-modal")
                        ?.classList.remove("hidden");
                    }}
                  >
                    Add New
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Rotating SMTP
              </h1>
              <div className={"text-gray-500 flex flex-col break-words"}>
                <span>One login per line.</span>
                <span>
                  smtp_user:smtp_pass:smtp_host:smtp_port:secure_(true/false):email_from
                </span>
                <span>Ex:</span>
                <span>
                  user@a.com:1234eggs:smtp.a.com:587:secure_true:hello@a.com
                </span>
              </div>
              <div className={"pt-4"}>
                <div className="flex flex-col items-center pt-3 hover-circle">
                  <TextField
                    id="rotating_smtp"
                    label="Rotating SMTP"
                    variant="outlined"
                    multiline
                    rows={4}
                    sx={{
                      width: "100%",
                    }}
                    value={smtpCreds || ""}
                    onChange={(e) => {
                      setSmtpCreds(e.target.value);
                    }}
                  />
                  <FormButton
                    className={"mt-4"}
                    onClickLoading={() => {
                      return setSettingClient(
                        "smtp_credentials",
                        smtpCreds
                      ).then(() => {
                        snackbar.enqueueSnackbar("Changes successfully added", {
                          variant: "success",
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
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                SMTP Proxies
              </h1>
              <span className={"text-gray-500"}>
                See{" "}
                <a href={"https://nodemailer.com/smtp/proxies/"}>
                  NodeMailer Proxy Configuration
                </a>
              </span>
              <div className={"pt-4"}>
                <div className="flex flex-col items-center pt-3 hover-circle">
                  <TextField
                    id="smtp_proxies"
                    label="SMTP Proxies"
                    variant="outlined"
                    multiline
                    rows={9}
                    sx={{
                      width: "100%",
                    }}
                    defaultValue={props.smtpProxies || ""}
                  />
                  <FormButton
                    className={"mt-4"}
                    onClickLoading={() => {
                      const smtpProxies = (
                        document.getElementById(
                          "smtp_proxies"
                        ) as HTMLInputElement
                      ).value;
                      return setSettingClient("smtp_proxies", smtpProxies).then(
                        () => {
                          snackbar.enqueueSnackbar(
                            "Changes successfully added",
                            {
                              variant: "success",
                            }
                          );
                        }
                      );
                    }}
                  >
                    Save
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Out Of Stock Discord Webhook URL
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"outOfStockWebhookUrl"}>URL</label>
                <input
                  type="url"
                  name="outOfStockWebhookUrl"
                  id="outOfStockWebhookUrl"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={defaultOutOfStockWebhookUrl}
                />
                <span className={"text-gray-500"}>
                  Set to empty to disable.
                </span>
                <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                  <FormButton
                    onClickLoading={() => {
                      const url = (
                        document.getElementById(
                          "outOfStockWebhookUrl"
                        ) as HTMLInputElement
                      ).value;
                      return setSettingClient("outOfStockWebhookUrl", url)
                        .then(() => {
                          setInfo("Successfully updated webhook!");
                        })
                        .catch((eX) => {
                          errorLog(eX);
                          setError(
                            eX?.response?.data?.message || "Unknown Error"
                          );
                        });
                    }}
                    className={""}
                  >
                    Update Webhook
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Verification Discord Webhook URL
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"outOfStockWebhookUrl"}>URL</label>
                <input
                  type="url"
                  name="orderVerificationWebhookUrl"
                  id="orderVerificationWebhookUrl"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={defaultOrderVerificationWebhookUrl}
                />
                <span className={"text-gray-500"}>
                  Set to empty to disable.
                </span>
                <FormButton
                  onClickLoading={() => {
                    const url = (
                      document.getElementById(
                        "orderVerificationWebhookUrl"
                      ) as HTMLInputElement
                    ).value;
                    return setSettingClient("orderVerificationWebhookUrl", url)
                      .then(() => {
                        setInfo("Successfully updated webhook!");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update Webhook
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card className="h-[100%] relative">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Audit Webhook URL
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"auditWebhookUrl"}>URL</label>
                <input
                  type="url"
                  name="auditWebhookUrl"
                  id="auditWebhookUrl"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150"
                  required={true}
                  defaultValue={props.defaultAuditWebhookUrl}
                />
                <span className={"text-gray-500"}>
                  Set to empty to disable.
                </span>
                <div className="lg:absolute w-[92%] mx-auto bottom-5 left-0 right-0">
                  <FormButton
                    onClickLoading={() => {
                      const url = (
                        document.getElementById(
                          "auditWebhookUrl"
                        ) as HTMLInputElement
                      ).value;
                      return setSettingClient("auditWebhookUrl", url)
                        .then(() => {
                          setInfo("Successfully updated webhook!");
                        })
                        .catch((eX) => {
                          errorLog(eX);
                          setError(
                            eX?.response?.data?.message || "Unknown Error"
                          );
                        });
                    }}
                    className={"mt-2"}
                  >
                    Update Webhook
                  </FormButton>
                </div>
              </div>
            </Card>
          </Grid>
        </Grid>
      </RequireRole>
    </AdminNavProvider>
  );
};

export default Index;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { info, error } = context.query;
  const SettingsModel = await getSettingsModel();
  const settingsData = await SettingsModel.findOne({
    key: "featuredProducts",
  });
  const settingsDiscountData = await SettingsModel.findOne({
    key: "discountProducts",
  });
  const ProductModel = await getProductModel();
  const allProducts = await ProductModel.find();
  const finalAllProducts: FullProductInterfaceWithOption[] =
    getFullProductWithOptionsDefaultArr(allProducts);
  let finalFeaturedProducts;
  let finalDiscountProducts: any = [];
  if (settingsData) {
    const { value } = settingsData;
    const featuredProducts = value as string[];
    if (featuredProducts && featuredProducts.length !== 0) {
      const data = await ProductModel.find({
        _id: { $in: featuredProducts },
      });
      const finalData: FullProductInterfaceWithOption[] =
        getFullProductWithOptionsDefaultArr(data);
      // reorder finaldata to match value (by id)
      finalData.sort((a, b) => {
        return featuredProducts.indexOf(a.id) - featuredProducts.indexOf(b.id);
      });
      finalFeaturedProducts = finalData;
    }
  }
  if (settingsDiscountData) {
    const value = settingsDiscountData.value;
    for (const discount of value) {
      const discountProducts = discount.products as string[];
      if (discountProducts && discountProducts.length !== 0) {
        const data = await ProductModel.find({
          _id: { $in: discountProducts },
        });
        const finalData: FullProductInterfaceWithOption[] =
          getFullProductWithOptionsDefaultArr(data);
        // reorder finaldata to match value (by id)
        finalData.sort((a, b) => {
          return (
            discountProducts.indexOf(a.id) - discountProducts.indexOf(b.id)
          );
        });

        finalDiscountProducts.push({
          products: finalData,
          discountValue: discount?.discount,
          discountCode: discount?.code,
          paymentMethod: discount.paymentMethod,
        });
      }
    }
  }
  return {
    props: {
      errAlert: error || "",
      infAlert: info || "",
      defaultGuestOrders: await getSetting("guestOrders", false),
      defaultShowCrisp: (await getSetting(
        "showCrisp",
        "show-purchased"
      )) as DisplayBehavior,
      defaultShowSupport: (await getSetting(
        "showSupport",
        "show-purchased"
      )) as DisplayBehavior,
      featuredProducts: JSON.parse(JSON.stringify(finalFeaturedProducts || [])),
      discountProducts: JSON.parse(JSON.stringify(finalDiscountProducts || [])),
      allProducts: JSON.parse(JSON.stringify(finalAllProducts)),
      discountValue: JSON.parse(
        JSON.stringify(finalDiscountProducts?.discountValue || "")
      ),
      discountCode: JSON.parse(
        JSON.stringify(finalDiscountProducts?.discountCode || "")
      ),
      cashAppAdjustment: await getSetting("cashAppAdjustment", 100),
      enableCashApp: await getSetting("enableCashApp", true),
      cashTag: await getSetting("cashTag", "NOT_SET"),
      cashAppQrCodeUrl: await getSetting("cashAppQrCodeUrl", ""),
      defaultProxies: await getSetting("proxies", ""),
      defaultSellixProxies: await getSetting("sellixProxies", true),
      enableCashAppReceiptCheckingDef: await getSetting(
        "cashAppReceiptChecking",
        true
      ),
      receiptCheckingProxyDef: await getSetting("receiptCheckingProxy", false),
      defaultSmtpCreds: await getSetting("smtp_credentials", ""),
      supportLinkDef: await getSetting("supportLink", ""),
      defaultOutOfStockWebhookUrl: await getSetting("outOfStockWebhookUrl", ""),
      defaultOrderVerificationWebhookUrl: await getSetting(
        "orderVerificationWebhookUrl",
        ""
      ),
      defaultAuditWebhookUrl: await getSetting("auditWebhookUrl", ""),
      defaultCrispKey: await getSetting("crispKey", ""),
      smtpProxies: await getSetting("smtp_proxies", ""),
    },
  };
}

interface AddProductModalProps {
  products: FullProductInterfaceWithOption[];
  currentProducts: FullProductInterfaceWithOption[];
  id: string;
  discount: boolean;
  featured: boolean;
  productId: string;
  discountValue: string;
  discountCode: string;
  selectedValue: string;
}
