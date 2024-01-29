"use client";

import React from "react";

import { FaEdit } from "react-icons/fa";

import { SubOrderInterface } from "@app-types/models/order";
import { getPrice } from "@util/EasterEgg";

import { Button } from "../Button";

export type OrderPropsInterface = {
  _id: string;
  user: string;
  timestamp: string;
  /*

  product: string;
  productName: string;
  productPrice: number;
  productQuantity: number;
  productOption: string;
   */
  subOrders: SubOrderInterface[];
  color?: "purple" | "black";
};

const Order = (props: OrderPropsInterface) => {
  return (
    <>
      <a href={`/admin/order/${props._id}`}>
        <div
          className={`text-gray-100 rounded-lg py-2 mb-5 px-5 ${
            props.color === "purple" ? "bg-primary-800" : "bg-gray-800"
          }`}
        >
          <div className="inline-block align-middle h-full">
            <p className="text-xl">{props.subOrders[0]?.productName}</p>
            <span className="text-base text-gray-400 mr-2">
              {getPrice(
                Math.round(
                  ((props.subOrders[0]?.productPrice || -1) + Number.EPSILON) *
                    100
                ) / 100
              )}{" "}
              (Quantity of {props?.subOrders[0]?.productQuantity}){" "}
            </span>
            ·
            <span className="text-base text-gray-400 ml-2">
              {props.subOrders[0]?.productOption}
            </span>
          </div>
          <div className="float-right align-middle p-1">
            <Button icon={FaEdit}>View</Button>
          </div>
        </div>
      </a>
    </>
  );
};

export default Order;
