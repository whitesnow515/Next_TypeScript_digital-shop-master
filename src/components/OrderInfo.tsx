/* eslint-disable no-unsafe-optional-chaining */
import React, {memo, useEffect, useState} from "react";

import {getWarrantyExpiryDate, OrderInterface, StockInfoInterface, SubOrderInterface,} from "@app-types/models/order";
import {getPrice} from "@util/EasterEgg";

interface OrderInfoProps {
  order: OrderInterface;
  orderData: SubOrderInterface | null | undefined | any;
  admin?: boolean;
  minified?: boolean;
}

const OrderInfo = ({ order, orderData, admin, minified }: OrderInfoProps) => {
  const [date, setDate] = useState<string>("Loading..."); // thanks, nextjs ssr!
  const [showImg, setShowImg] = useState<boolean>(!!order.image);
  useEffect(() => {
    // load date client-side
    setDate(new Date(order.timestamp).toLocaleString());
  }, [order.timestamp]);

  const OrderStatus = memo(function OrderStatus() {
    // @ts-ignore
    if (order.status === "completed" && order.status === "complete") {
      return (
        <div className={"flex gap-0"}>
          <div className="flex items-center bg-[#59D990] border border-[#59D990] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
          <span className="text-xs font-medium rounded-full text-white">
            Complete
          </span>
        </div>
      );
    }
    if (order.status === "awaiting-verification") {
      return (
        <div className={"flex gap-0"}>
          <div className="flex items-center bg-[#FFC700] border border-[#FFC700] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
          <span className="text-xs font-medium rounded-full text-white">
            Awaiting Verification {!minified && " (Paid)"}
          </span>
        </div>
      );
    }
    return (
      <div className={"flex gap-0"}>
        <div className="flex items-center bg-[#FF1F40] border border-[#FF1F40] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        {order.status === "pending" ? (
          <span className="text-xs font-medium rounded-full text-white">
            Pending
          </span>
        ) : order.status === "cancelled" ? (
          <span className="text-xs font-medium rounded-full text-white">
            Cancelled
          </span>
        ) : order.status === "refunded" ? (
          <span className="text-xs font-medium rounded-full text-white">
            Refunded
          </span>
        ) : order.status === "out-of-stock" ? (
          <span className="text-xs font-medium rounded-full text-white">
            Out Of Stock
          </span>
        ) : (
          <span>{order.status}</span>
        )}
      </div>
    );
  });

  const WarrantyStatus = memo(function WarrantyStatus() {
    if (
      orderData &&
      orderData.warrantyEnabled &&
      (order.status === "completed" || order.status === "complete")
    ) {
      const expiryDate = getWarrantyExpiryDate(
        order,
        false // Disallow defaulting to timestamp
      );
      if (expiryDate) {
        if (expiryDate < new Date()) {
          return (
            <p className={"text-red-500"}>
              Expired on{" "}
              {new Date(expiryDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          );
        }
        return (
          <p className={"text-green-500"}>
            Active until{" "}
            {new Date(expiryDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <br />
            {/* hours left */}
            <span className={"text-sm"}>
              {Math.floor(
                (expiryDate.getTime() - new Date().getTime()) / 1000 / 60 / 60
              )}{" "}
              hours left
            </span>
          </p>
        );
      }
    }
    return (
      <p className={"text-red-500"}>
        Not Active
        {order.status === "awaiting-verification" &&
          " (activates once verified)"}
      </p>
    );
  });
  return (
    <div
      className={"text-white text-sm flex flex-wrap md:justify-between gap-6"}
    >
      <div className="flex flex-col w-full md:w-auto items-center md:items-start gap-5">
        <OrderStatus />

        <img className="w-24 h-24" src="/assets/images/order-icon.svg" />
      </div>
      <div className="flex flex-col w-full md:w-auto gap-8">
        <div>
          <h3 className="font-bold">Order ID</h3>
          <p>{order._id}</p>
        </div>
        <div>
          <h3 className="font-bold">Waranty</h3>
          <WarrantyStatus />
          <p>{date}</p>
        </div>
      </div>
      <div className="flex flex-col w-full md:w-auto gap-8">
        <div>
          <h3 className="font-bold">Total</h3>
          <p>{getPrice(order?.totalPrice?.toFixed(2))}</p>
        </div>
        <div>
          <h3 className="font-bold">Replacement Granted</h3>
          {orderData?.stocks?.some((s: StockInfoInterface) => {
            return s.replacement; // TODO make sure this works
          }) ? (
            <span className={"text-green-500"}>Yes</span>
          ) : (
            <span className={"text-red-500"}>No</span>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full md:w-auto gap-8">
        <div>
          <h3 className="font-bold">Email</h3>
          <p>{order.email || "UNKNOWN"}</p>
        </div>
        <div>
          <h3 className="font-bold">Balance Spent</h3>
          <p>{getPrice(order.userBalanceSpent?.toFixed(2))}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderInfo;
