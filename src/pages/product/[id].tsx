import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Big from "big.js";
import { ObjectId } from "bson";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";

import {
  cleanSensitiveOptionData,
  cleanSensitiveProductData,
  FullProductInterfaceWithOption,
  ProductOption,
  ProductOptionWithStock,
} from "@app-types/models/product";
import { allPaymentProviders } from "@app-types/payment/providers";
import Modal from "@components/admin/Modal";
import AppWrapper from "@components/AppWrapper";
import CaptchaWidget from "@components/captcha/CaptchaWidget";
import Field from "@components/Field";
import FormButton from "@components/FormButton";
import PaymentProviderSelection from "@components/PaymentProviderSelection";
import Product from "@components/Product";
import { Meta } from "@components/templates/Meta";
import getProductModel from "@models/product";
import { ProductSortBehavior } from "@src/types";
import { error } from "@util/log";
import { setStocks } from "@util/products";
import { getSetting } from "@util/SettingsHelper";
import { useCart } from "react-use-cart";
import { CaretDown, Minus, Plus } from "phosphor-react";
import { CartContext } from "@pages/_app";
import MarkIndicator from "@components/products/MarkIndicator";
import TopTitle from "@components/typography/TopTitle";

const GetOption = ({
  active,
  click,
  name,
  stock,
}: {
  active: boolean;
  name: string;
  stock: any;
  click: () => void;
}) => {
  if (!active) {
    return (
      <div
        className={
          "flex hover:bg-[#303633] border-[#F0F0F0] opacity-50 items-center p-4 pt-2.5 pb-2 justify-between"
        }
      >
        <div className={"text-white font-medium"}>{name}</div>
        <div className={"flex items-center gap-1.5 text-sm"}>
          <div className={"w-3 h-3 bg-[#FF0000] rounded-full"} />0
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={click}
      className={
        "flex hover:cursor-pointer border-[#F0F0F0] hover:bg-[#303633] text-white items-center p-4 pt-2.5 pb-2 justify-between"
      }
    >
      <div className={" font-medium"}>{name}</div>
      <div className={"flex items-center gap-1.5 text-sm"}>
        <div className={"w-3 h-3 bg-[#20E35A] rounded-full"} />
        {stock}
      </div>
    </div>
  );
};
const ProductPage = ({
  product,
  option,
  banner,
  mdxSource,
  featuredProducts,
  paymentMethods,
  allowsGuest,
  isFeatured,
  captchaKey,
  cashAppFee,
  defaultImage,
  noStock,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const [userBalance, setUserBalance] = React.useState(0);
  const router = useRouter();
  useEffect(() => {
    if (session.status === "authenticated") {
      axios.get("/api/user/balance/").then((res) => {
        setUserBalance(res.data?.balance || 0);
      });
    }
  }, [session]);
  const { addItem, items } = useCart();

  const [optionMenu, setOptionMenu] = React.useState<boolean>();
  const [PlusScaled, setPlusScaled] = React.useState(false);
  const [MinusScaled, setMinusScaled] = React.useState(false);
  const { setMenu } = useContext(CartContext);
  const [quantity, setQuantity] = React.useState(
    product.minimum ? product.minimum : 1
  );
  const [total, setTotal] = React.useState<number>(0);
  const [quantityError, setQuantityError] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState(option);
  const emailRef = React.useRef(null);
  const [showCaptcha, setShowCaptcha] = React.useState(false);
  const [options, setOptions] = React.useState<ProductOptionWithStock[]>([]);
  const dynamicRoute = useRouter().asPath;
  const buyDisable =
    (selectedOption?.stock || 0) === 0 ||
    quantityError ||
    !selectedOption ||
    (product.maximum && quantity > product.maximum) ||
    (product.minimum && quantity < product.minimum);
  const minErr = product.minimum && quantity < product.minimum;
  const maxErr = product.maximum && quantity > product.maximum;
  const isInCart:
    | {
        quantity: number;
        product: {
          maximum: number;
        };
        totalStockLines: number;
      }
    | any = items.find((x) => x.id === selectedOption?._id);

  const outofbound = isInCart
    ? isInCart.quantity + 1 > isInCart.product.maximum ||
      isInCart.quantity + 1 > isInCart.totalStockLines
    : false;

  const optionsZero =
    product.options.filter((x: any) => {
      if (!selectedOption) return true;

      return x._id !== selectedOption?._id;
    }).length == 0;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const pageRangeDisplayed = 5;
  // Calculate the indexes for the current page
  const totalPages = Math.ceil(featuredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get the items for the current page
  const currentItems =
    featuredProducts && featuredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  function getImageSrc(image: any) {
    if (image) {
      if (image.indexOf("http") === 0) {
        return image;
      }
      // const domain = window.location.origin;
      return `/api/assets/img/${image}/`;
    }
    if (defaultImage) return defaultImage;
    return null;
  }

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const halfRange = Math.floor(pageRangeDisplayed / 2);

    if (totalPages <= pageRangeDisplayed) {
      // Display all pages if the total number of pages is less than or equal to the range
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            disabled={currentPage === i}
            className={
              currentPage === i
                ? "bg-[#303633] text-white text-sm rounded-md w-[32px] h-[32px]"
                : "text-[#64656E] hover:bg-[#303633] text-sm w-[32px] h-[32px] rounded-md"
            }
          >
            {i}
          </button>
        );
      }
    } else {
      // Display a dynamic range of pages with ellipsis indicators
      let start = Math.max(1, currentPage - halfRange);
      let end = Math.min(totalPages, start + pageRangeDisplayed - 1);

      if (end - start < pageRangeDisplayed - 1) {
        start = Math.max(1, end - pageRangeDisplayed + 1);
      }

      if (start > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => handlePageChange(1)}
            className={
              currentPage === 1
                ? "bg-[#303633] text-white text-sm rounded-md w-[32px] h-[32px]"
                : "text-[#64656E] hover:bg-[#303633] text-sm w-[32px] h-[32px] rounded-md"
            }
          >
            1
          </button>
        );
        if (start > 2) {
          pageNumbers.push(
            <span key={`ellipsis-start`} className="ellipsis text-[#64656E]">
              ...
            </span>
          );
        }
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={
              currentPage === i
                ? "bg-[#303633] text-white text-sm rounded-md w-[32px] h-[32px]"
                : "text-[#64656E] hover:bg-[#303633] text-sm w-[32px] h-[32px] rounded-md"
            }
          >
            {i}
          </button>
        );
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pageNumbers.push(
            <span key={`ellipsis-end`} className="ellipsis text-[#64656E]">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => handlePageChange(totalPages)}
            className={
              currentPage === totalPages
                ? "bg-[#303633] text-white text-sm rounded-md w-[32px] h-[32px]"
                : "text-[#64656E] hover:bg-[#303633] text-sm w-[32px] h-[32px] rounded-md"
            }
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  useEffect(() => {
    // product changed, reset quantity
    setQuantity(product.minimum ? product.minimum : 1);
  }, [dynamicRoute]);
  useEffect(() => {
    const sortBehavior = product.sort as ProductSortBehavior;
    if (sortBehavior === "none") {
      setOptions(product.options);
    } else if (sortBehavior === "alphabetical") {
      setOptions(
        product.options.sort((a: ProductOption, b: ProductOption) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        })
      );
    } else if (sortBehavior === "value") {
      setOptions(
        product.options.sort((a: ProductOption, b: ProductOption) => {
          if (a.price < b.price) {
            return -1;
          }
          if (a.price > b.price) {
            return 1;
          }
          return 0;
        })
      );
    }
  }, [product]);
  useEffect(() => {
    // (selectedOption?.price ?? 0) * (quantity ?? 0)
    // Modify this to use Big.js
    setTotal(
      new Big(selectedOption?.price || 0)
        .times(new Big(quantity || 0).toNumber())
        .toNumber()
    );
  }, [quantity, selectedOption]);

  // this is because when switching from one product to another via next's <Link> component, we're on the same slug path so nextjs just puts new props in the same page
  // we need to update the selected option when the option prop changes
  useEffect(() => {
    setSelectedOption(option);
  }, [option]);

  function showSelectPaymentProviderModal() {
    if (userBalance >= total) {
      document
        .getElementById("confirm-pay-with-balance")
        ?.classList.remove("hidden");
      return;
    }
    document
      .getElementById("select-payment-provider-modal")
      ?.classList.remove("hidden");
  }

  function checkValue(sender: any) {
    let min = parseInt(sender.target.min);
    let max = parseInt(sender.target.max);
    let value = parseInt(sender.target.value);
    if (value > max || value > product?.stock) {
      if (value > product?.stock) {
        return setQuantity(product?.stock);
      }
      setQuantity(max);
      return true;
    } else if (value < min) {
      setQuantity(min);
      return true;
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        document.getElementById("modal-id") &&
        !(document.getElementById("modal-id") as HTMLElement).contains(
          event.target as HTMLElement
        ) &&
        !(document.getElementById("dropdown-button") as HTMLElement).contains(
          event.target as HTMLElement
        )
      ) {
        setOptionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <AppWrapper>
      <Meta
        title={`Products - ${product.name}`}
        description={product.shortDescription}
      />
      <div className={"flex flex-col text-white pl-4 mx-auto w-full"}>
        <Modal
          id={"select-payment-provider-modal"}
          title={"Select Payment Provider"}
          description={
            "Please select a payment provider to complete your purchase."
          }
          buttons={
            <>
              <FormButton
                type={"button"}
                color={"red"}
                fullWidth={false}
                onClick={() => {
                  document
                    .getElementById("select-payment-provider-modal")
                    ?.classList.add("hidden");
                }}
              >
                Cancel
              </FormButton>
            </>
          }
        >
          {userBalance > 0 && (
            <div className={"text-gray-400 pt-2 text-sm"}>
              <p>
                Your current balance is{" "}
                <span className={"text-green-500"}>${userBalance}</span>.
              </p>
              <p>It will be automatically applied to your purchase.</p>
            </div>
          )}
          <ul className="my-4 space-y-3">
            <li key={"sellix"}>
              <PaymentProviderSelection
                provider={
                  {
                    name: "Sellix",
                    label: "Sellix (CashApp, Crypto)",
                    url: "https://avatars.githubusercontent.com/u/66204773?s=280&v=4",
                    imgWidth: 36,
                    imgHeight: 36,
                  } as any
                }
                product={product}
                selectedOption={selectedOption}
                quantity={quantity}
                emailRef={emailRef}
                session={session}
                allowGuestCheckout={allowsGuest}
                total={total}
                fee={0}
                hideModal={() => {
                  document
                    .getElementById("select-payment-provider-modal")
                    ?.classList.add("hidden");
                }}
              />
            </li>
          </ul>
        </Modal>
        <Modal
          id={"confirm-pay-with-balance"}
          title={"Confirmation"}
          description={
            <>
              <span>
                Are you sure you want to purchase this?
                <br />
                Your balance of{" "}
                <span className={"text-green-500"}>${userBalance}</span> will be
                used for this purchase.
              </span>
            </>
          }
          buttons={
            <>
              <FormButton
                type={"button"}
                color={"green"}
                fullWidth={false}
                className={"mx-4"}
                onClickLoading={() => {
                  const data: any = {
                    productId: product._id,
                    optionId: selectedOption?._id,
                    quantity,
                    paymentMethod: "Balance",
                  };

                  if (
                    session &&
                    session.status === "unauthenticated" &&
                    allowsGuest &&
                    emailRef?.current
                  ) {
                    data.email = (emailRef.current as HTMLInputElement).value;
                  }
                  if (window.captchaToken) {
                    data["cf-turnstile-response"] = window.captchaToken;
                  }
                  return axios
                    .post(`/api/checkout/`, data)
                    .then((res) => {
                      if (res.data.success) {
                        window.location.href = res.data.paymentUrl;
                      } else {
                        Swal.fire({
                          title: "Error",
                          text: res.data.message,
                          icon: "error",
                        });
                      }
                    })
                    .catch((err) => {
                      error(err);
                      Swal.fire({
                        title: "Error",
                        text: err.response?.data?.message || err.message,
                        icon: "error",
                      });
                    });
                }}
              >
                Confirm
              </FormButton>
              <FormButton
                type={"button"}
                color={"red"}
                fullWidth={false}
                onClick={() => {
                  document
                    .getElementById("confirm-pay-with-balance")
                    ?.classList.add("hidden");
                }}
              >
                Cancel
              </FormButton>
            </>
          }
        ></Modal>
        <Modal
          id={"enter-email-modal"}
          title={"Enter your email address."}
          description={
            <>
              <span>
                Please enter your email address to start your purchase.
              </span>
              <br />
              <span>
                Or
                <a href={"/auth/signin/"} className={"text-white"}>
                  {" "}
                  Sign In
                </a>
              </span>
            </>
          }
          buttons={
            <>
              <FormButton
                type={"button"}
                color={"green"}
                fullWidth={false}
                className={"mx-4"}
                onClick={() => {
                  document
                    .getElementById("enter-email-modal")
                    ?.classList.add("hidden");
                  showSelectPaymentProviderModal();
                }}
              >
                Save
              </FormButton>
              <FormButton
                type={"button"}
                color={"red"}
                fullWidth={false}
                onClick={() => {
                  document
                    .getElementById("enter-email-modal")
                    ?.classList.add("hidden");
                }}
              >
                Cancel
              </FormButton>
            </>
          }
        >
          <Field
            id={"enter-email-field"}
            name={"email"}
            required
            placeholder={"john.doe@example.com"}
            type={"email"}
            className={"pt-2"}
            refPassThrough={emailRef}
          >
            Email
          </Field>
        </Modal>
        <Modal
          id={"captcha-modal"}
          title={"Please complete the captcha."}
          description={"It may take a few seconds to load."}
          buttons={<></>}
        >
          {showCaptcha && (
            <CaptchaWidget
              className={"pt-4"}
              captchaKey={captchaKey}
              onVerify={(token) => {
                document
                  .getElementById("captcha-modal")
                  ?.classList.add("hidden");
                const signedIn = session.status === "authenticated";
                setShowCaptcha(false);
                if (!signedIn) {
                  document
                    .getElementById("enter-email-modal")
                    ?.classList.remove("hidden");
                  return;
                }
                showSelectPaymentProviderModal();
              }}
            />
          )}
        </Modal>
        <div className="flex flex-col gap-10 mt-6 px-5 lg:px-12 xl:px-[100px] w-full">
          <div className="flex items-center flex-wrap md:flex-nowrap gap-3">
            <MarkIndicator title="Home" onClick={() => router.push("/")} />
            <MarkIndicator
              title="Categories"
              onClick={() => router.push("/products")}
            />
            <MarkIndicator title={product.name} />
          </div>
          <div className="w-full gap-10 flex flex-wrap xl:flex-nowrap justify-center xl:justify-between items-center xl:items-start">
            <div className="sm:w-[70%] md:w-[80%] lg:w-[70%] flex-0 h-auto py-10 md:py-0 md:h-[500px] md:shrink-0 md:basis-[600px] xl:sticky product-category-container">
              <div className="w-[70%]">
                <div className="b-QRbp6v">
                  <div className="b-orzNLz flex flex-col items-center justify-between b-JJssGU b-RRF6jh b-qu6O9G">
                    <div
                      className="b-EXzmIr b-gDKMPS"
                      data-shelf-item-graphic="true"
                    >
                      <span className="b-MgKtnT"></span>
                      <img
                        alt={product.name}
                        src={getImageSrc(product.image)}
                        className="h-full bg-[#F0F0F0] w-full mx-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 divide-y divide-white w-full xl:w-[48%]">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-wrap items-center gap-5">
                  <span className="text-white text-[40px] font-bold">
                    {product.name}
                  </span>
                  {noStock ? (
                    <button className="text-[13px] bg-[#E57D00] text-white rounded-full px-3 py-1">
                      Out of Stock
                    </button>
                  ) : isFeatured ? (
                    <button className="text-[13px] bg-black text-white rounded-full px-3 py-1">
                      Featured
                    </button>
                  ) : null}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white text-[32px] font-bold">
                    ${(product?.options[0]?.price || 0).toFixed(2)}
                  </span>
                  <div>
                    {noStock ? (
                      <div className={"flex items-center gap-2  text-[15px] "}>
                        <div className={"w-4 h-4 bg-red-600 rounded-full"} />
                        Product is out of stock
                      </div>
                    ) : (
                      <div className={"flex items-center gap-2  text-[15px] "}>
                        {selectedOption?.stock === 0 ? (
                          <div className={"w-4 h-4 bg-red-600 rounded-full"} />
                        ) : (
                          <div
                            className={"w-4 h-4 bg-[#2C7CF2] rounded-full"}
                          />
                        )}
                        {selectedOption?.stock} items available
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-base text-justify text-white/60 font-normal pb-10">
                  {product?.description}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-[#0000001A] w-full">
                <div className="flex flex-col gap-4 py-6 w-full">
                  <div style={{ opacity: noStock ? "50%" : "100%" }}>
                    <div className={"mt-6"}>
                      <div
                        className={"text-white font-normal pb-1 font-medium"}
                      >
                        Option ({product.options.length})
                      </div>
                      <div className={"relative"}>
                        <div
                          onClick={() => setOptionMenu((e) => !e)}
                          id="dropdown-button"
                          className={`bg-transparent border-[#393F3C] ${
                            !optionsZero
                              ? "hover:cursor-pointer hover:border-[#66736D]"
                              : ""
                          } ease border p-3 pl-5 mt-2 box-border rounded-lg flex justify-between items-center`}
                        >
                          <div
                            className={"text-white line-clamp-2 font-medium"}
                          >
                            {selectedOption
                              ? selectedOption.name
                              : "Select an option"}
                          </div>
                          {!optionsZero && (
                            <div
                              className={"text-white font-medium border-l pl-2"}
                            >
                              <CaretDown
                                weight={"bold"}
                                color={"#BAB8B8"}
                                size={27}
                              />
                            </div>
                          )}
                        </div>
                        {optionMenu && !optionsZero && (
                          <div
                            id="modal-id"
                            className={
                              "absolute z-30 bg-[#1F2421] rounded-b-lg h-max w-full left-0 top-[47px]"
                            }
                          >
                            {product.options
                              .filter((x: any) => {
                                if (!selectedOption) return true;

                                return x._id !== selectedOption?._id;
                              })
                              .map((opt: any) => (
                                <GetOption
                                  click={() => {
                                    setSelectedOption({ ...opt });
                                    setOptionMenu(false);
                                  }}
                                  name={opt.name}
                                  stock={opt.stock}
                                  active={opt.stock !== 0}
                                />
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 py-6 w-full">
                  {!noStock ? (
                    <div className="flex items-center justify-between w-full min-w-[170px] max-w-[170px] bg-[#303633] py-3 md:py-4 px-5 h-14 rounded-full">
                      <button
                        disabled={noStock}
                        onClick={() => {
                          setMinusScaled(!MinusScaled);
                          if (quantity - 1 < product.minimum) return;
                          if (quantity - 1 < 1) return;
                          setQuantity((q: any) => q - 1);
                        }}
                        className={`h-full ${
                          MinusScaled ? "hover:scale-125" : "scale-120"
                        } flex justify-center items-center`}
                      >
                        <Minus size={24} color="white" />
                      </button>
                      <input
                        value={quantity}
                        min={product.minimum ? product.minimum : 1}
                        disabled={noStock}
                        max={
                          product.maximum
                            ? product.maximum
                            : selectedOption?.stock
                        }
                        onChange={(e) => {
                          if (checkValue(e)) return;
                          const q = parseInt(e.target.value, 10);
                          setQuantity(q);
                          if (q > (selectedOption?.stock ?? 0) || q < 1) {
                            setQuantityError(true);
                          } else {
                            setQuantityError(false);
                          }
                        }}
                        className={
                          "hide--scrollbar text-center text-white text-base font-medium outline-none border-none bg-transparent"
                        }
                        type={"number"}
                      />
                      <button
                        disabled={noStock}
                        onClick={() => {
                          setPlusScaled(!PlusScaled);
                          if (quantity + 1 > product.maximum) return;
                          if (quantity + 1 > selectedOption.stock) return;

                          setQuantity((q: any) => q + 1);
                        }}
                        className={`${
                          PlusScaled ? "hover:scale-125" : "scale-120"
                        }`}
                      >
                        <Plus size={24} color="white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full opacity-[0.4] min-w-[170px] max-w-[170px] bg-[#303633] py-3 md:py-4 px-5 h-14 rounded-full">
                      <button
                        disabled={noStock}
                        onClick={() => {
                          setMinusScaled(!MinusScaled);
                          if (quantity - 1 < product.minimum) return;
                          if (quantity - 1 < 1) return;
                          setQuantity((q: any) => q - 1);
                        }}
                        className={`h-full ${
                          MinusScaled ? "hover:scale-125" : "scale-120"
                        } flex justify-center items-center`}
                      >
                        <Minus size={24} color="white" />
                      </button>
                      <input
                        value={quantity}
                        min={product.minimum ? product.minimum : 1}
                        disabled={noStock}
                        max={
                          product.maximum
                            ? product.maximum
                            : selectedOption?.stock
                        }
                        onChange={(e) => {
                          if (checkValue(e)) return;
                          const q = parseInt(e.target.value, 10);
                          setQuantity(q);
                          if (q > (selectedOption?.stock ?? 0) || q < 1) {
                            setQuantityError(true);
                          } else {
                            setQuantityError(false);
                          }
                        }}
                        className={
                          "hide--scrollbar text-center text-white text-base font-medium outline-none border-none bg-transparent"
                        }
                        type={"number"}
                      />
                      <button
                        disabled={noStock}
                        onClick={() => {
                          setPlusScaled(!PlusScaled);
                          if (quantity + 1 > product.maximum) return;
                          if (quantity + 1 > selectedOption.stock) return;

                          setQuantity((q: any) => q + 1);
                        }}
                        className={`${
                          PlusScaled ? "hover:scale-125" : "scale-120"
                        }`}
                      >
                        <Plus size={24} color="white" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (outofbound) return;
                      if (quantity > product.maximum) return;
                      if (quantity < product.minimum) return;
                      if (quantity > product.stock) return;

                      setMenu(true);
                      addItem(
                        {
                          id: selectedOption?._id,
                          ...selectedOption,
                          maximum: product.maximum,
                          minimum: product.quantity,
                          product,
                        },
                        quantity
                      );
                    }}
                    // style={{ opacity: outofbound ? "70%" : "100%" }}
                    disabled={selectedOption?.stock === 0}
                    className={`${
                      selectedOption?.stock === 0
                        ? "opacity-[0.4] bg-[#FF1F40]"
                        : "bg-[#FF1F40] hover:bg-[#BE0924]"
                    } select-none text-white w-full outline-none py-4 rounded-full font-bold px-5 text-center duration-300 relative`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mr-2 inline-block align-middle"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M7.73779 19.75C7.73779 18.7835 8.52129 18 9.48779 18C10.4543 18 11.2378 18.7835 11.2378 19.75C11.2378 20.7165 10.4543 21.5 9.48779 21.5C8.52129 21.5 7.73779 20.7165 7.73779 19.75Z"
                        fill="currentColor"
                      ></path>
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17 19.75C17 18.7835 17.7835 18 18.75 18C19.7165 18 20.5 18.7835 20.5 19.75C20.5 20.7165 19.7165 21.5 18.75 21.5C17.7835 21.5 17 20.7165 17 19.75Z"
                        fill="currentColor"
                      ></path>
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M2 3.98361C2 3.44038 2.44038 3 2.98361 3H6.26229C6.73111 3 7.13476 3.33087 7.22677 3.79057L7.88882 7.09836H21.0164C21.3095 7.09836 21.5874 7.22911 21.7743 7.45497C21.9611 7.68083 22.0375 7.97827 21.9826 8.26622L20.6697 15.1506C20.5498 15.7544 20.2213 16.2968 19.7417 16.6828C19.265 17.0666 18.6691 17.2716 18.0573 17.2623H10.1066C9.49487 17.2716 8.89897 17.0666 8.42218 16.6828C7.94293 16.297 7.61455 15.755 7.49445 15.1516C7.49439 15.1513 7.49432 15.151 7.49425 15.1506L6.12599 8.31445C6.11986 8.28912 6.1147 8.2634 6.11056 8.23735L5.45605 4.96721H2.98361C2.44038 4.96721 2 4.52684 2 3.98361ZM8.28256 9.06557L9.42378 14.7674C9.45376 14.9183 9.53588 15.0539 9.65576 15.1504C9.77564 15.2469 9.92564 15.2982 10.0795 15.2953L10.0984 15.2951H18.0656L18.0844 15.2953C18.2383 15.2982 18.3883 15.2469 18.5082 15.1504C18.6273 15.0545 18.7091 14.92 18.7396 14.7702C18.7398 14.7693 18.74 14.7683 18.7402 14.7674L19.8275 9.06557H8.28256Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                    <span className="align-middle">Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={"tb-4 border border-b border-white"}></div>
          <div className="flex flex-col items-center justify-center w-full gap-[50px] mt-2">
            {currentItems.length > 0 && (
              <>
                <TopTitle title="you might also like" />
                <div className="mb-4 w-full">
                  <div className="flex w-full pr-4">
                    <div className="flex flex-col w-full">
                      <h1 className={"border-bottom"}></h1>
                      <div className={"flex flex-row"}>
                        <div
                          className={` items-start grid grid-cols-2 md:grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-center ${
                            currentItems.length < 4
                              ? "md:justify-start"
                              : "md:justify-center"
                          } w-full pt-8`}
                        >
                          {currentItems.map(
                            (
                              prod: FullProductInterfaceWithOption,
                              index: number
                            ) => {
                              return (
                                <div className="">
                                  <Product
                                    name={prod.name}
                                    price={
                                      prod && (prod.options[0]?.price as number)
                                    }
                                    image={prod.image}
                                    key={prod._id?.toString()}
                                    stock={prod.stock}
                                    defaultImage={defaultImage}
                                    legacyImage
                                    oos={prod.options.length === 0}
                                    featured={false}
                                  />
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                      {currentItems.length > 0 && (
                        <div className="flex justify-center mt-10">
                          {/* <Pagination
                count={maxPages}
                page={page}
                onChange={(_e, p) => {
                  setPage(p);
                }}
              /> */}

                          <div className="flex gap-5">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="text-[#64656E] text-xl"
                            >
                              {"<"}
                            </button>
                            {renderPageNumbers()}
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={endIndex >= featuredProducts.length}
                              className="text-[#64656E] text-xl"
                            >
                              {">"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppWrapper>
  );
};
export default ProductPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, option } = context.query;
  const ProductModel = await getProductModel();
  // id is urlencoded name/_id
  const idDecoded: string = decodeURIComponent(id as string);
  const queryId = ObjectId.isValid(idDecoded);
  let rawProduct =
    (queryId && (await ProductModel.findById(idDecoded))) ||
    (await ProductModel.findOne({ name: idDecoded }));
  if (!rawProduct && queryId) {
    rawProduct = await ProductModel.findOne({ name: idDecoded });
  }
  if (!rawProduct || rawProduct.hidden) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }
  const data: any = await setStocks(rawProduct);
  const rawOptions = data.options;
  const options = rawOptions.filter((opt: ProductOption) => {
    return !opt.hidden;
  });
  data.options = options;
  let selectedOption = options.find((opt: any) => {
    if (option && option.length > 0) {
      return opt._id.toString() === (option as string);
    }
    return false;
  });
  if (!selectedOption) {
    // set default option
    selectedOption =
      options.find((opt: ProductOption) => {
        return opt.default;
      }) || options[0];
  }
  if (!selectedOption?.stock) {
    // find the next available option
    selectedOption =
      options.filter((data: any) => data.totalStockLines >= 1)[0] || options[0];
  }

  const defaultImage = await getSetting("defaultImage", "");

  function getBannerImage(): string {
    if (data.bannerImage) {
      if (data.bannerImage.indexOf("http") === 0) {
        return data.bannerImage as string;
      }
      return `/api/assets/img/${data.bannerImage}/?type=product-banner-img`;
    }
    return defaultImage;
  }

  const mdxSource = await serialize(data.description, {
    mdxOptions: {
      rehypePlugins: [remarkGfm],
    },
  });
  const featured = await ProductModel.find({});
  const finalFeatured = featured.filter((prod: any) => {
    return (
      prod.category &&
      rawProduct?.category &&
      prod.category.toString() === rawProduct?.category.toString() &&
      prod._id.toString() !== rawProduct._id.toString()
    );
  });
  const enableCashApp = await getSetting("enableCashApp", true);
  const availablePaymentMethods = allPaymentProviders.filter((prov) => {
    return !(prov.name === "CashApp" && !enableCashApp);
  });
  let cashAppFee = 0;
  if (enableCashApp) {
    cashAppFee = (await getSetting("cashAppAdjustment", 100)) as number;
  }
  const allowsGuest = true; //await getSetting("guestOrders", false);
  const isFeatured =
    featured.filter((prod: any) => prod._id.toString() === data._id.toString())
      .length > 0;
  return {
    props: {
      product: cleanSensitiveProductData(data),
      option: cleanSensitiveOptionData(selectedOption || null),
      banner: getBannerImage(),
      mdxSource,
      featuredProducts: finalFeatured.map((prod: any) =>
        cleanSensitiveProductData(prod)
      ),
      isFeatured: isFeatured,
      paymentMethods: JSON.parse(JSON.stringify(availablePaymentMethods)),
      allowsGuest,
      noStock: options.filter((x: any) => x.stock > 0).length === 0,
      captchaKey: process.env.CAPTCHA_SITE_KEY ?? "",
      cashAppFee,
      defaultImage,
    },
  };
}
