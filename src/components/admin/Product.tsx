"use client";

import React from "react";

import axios from "axios";
import { FaEdit, FaShoppingBag, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

import RequireRole from "@components/auth/RequireRole";

import { Button } from "../Button";
import { useSnackbar } from "notistack";

type AdminProductPropsInterface = {
  id: string;
  name: string;
  stock?: number | 0;
  price?: number | 0;
  image: string | undefined;
  color: "purple" | "black";
};

const imgStyle = {
  // borderRadius: "50%",
  minWidth: "50px",
  maxHeight: "50px",
};
const Product = (props: AdminProductPropsInterface) => {
  const snackbar = useSnackbar();
  function getImage() {
    if (props.image) {
      if (props.image.indexOf("http") === 0) {
        return props.image as string;
      }
      return `/api/assets/img/${props.image}/?type=product-img`;
    }
    return null;
  }

  return (
    <>
      <div
        className={`text-gray-100 rounded-lg py-2 mb-5 px-5 ${
          props.color === "purple" ? "bg-primary-800" : "bg-gray-800"
        }`}
      >
        <a href={`/admin/products/${props.id}`}>
          <div className="inline-block mr-5 h-full align-middle">
            {getImage() === null ? (
              <FaShoppingBag size={50} />
            ) : (
              <img
                src={getImage() as string}
                alt="products image"
                height={50}
                style={imgStyle}
              />
            )}
          </div>
          <div className="inline-block align-middle h-full">
            <p className="text-xl">{props.name}</p>
            <span className="text-base text-gray-400 mr-2">
              {props.stock} in stock
            </span>
          </div>
        </a>
        <div className="float-right align-middle p-1">
          <RequireRole admin>
            <Button
              icon={FaTrash}
              className={"mr-4"}
              color={"red"}
              onClick={(e) => {
                Swal.fire({
                  title: "Are you sure?",
                  html: `You are deleting the product "${props.name}".\nThis will also delete any (un-purchased) associated stock & options!`,
                  icon: "warning",
                  showCancelButton: true,
                }).then((result) => {
                  if (result.isConfirmed) {
                    axios
                      .post("/api/products/delete/", {
                        id: props.id,
                      })
                      .then((res) => {
                        if (res.data.success) {
                          snackbar.enqueueSnackbar("Product deleted", {
                            variant: "success",
                          });

                          window.location.reload();
                        } else {
                          Swal.fire({
                            title: "Error!",
                            text: res.data.message,
                            icon: "error",
                          });
                        }
                      })
                      .catch((err) => {
                        Swal.fire({
                          title: "Error!",
                          text: err.message,
                          icon: "error",
                        });
                      });
                  }
                });
              }}
            >
              Delete
            </Button>
          </RequireRole>
          <a href={`/admin/products/${props.id}`}>
            <Button icon={FaEdit}>Edit</Button>
          </a>
        </div>
      </div>
    </>
  );
};

export default Product;
