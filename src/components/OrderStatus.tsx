import { completeStatus, pendingStatus } from "@root/currency";
import React from "react";

const OrderStatus = ({ status }: { status: string }) => {
  const transformStatus = (status: string) => {
    const transformedStatus = status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
      });
    return transformedStatus;
  };
  if (
    completeStatus.includes(status) ||
    status.toLowerCase() === "completed" ||
    status.toLowerCase() === "complete"
  ) {
    return (
      <div className={"flex gap-0 me-2 pb-2 pt-1"}>
        <div className="flex items-center bg-[#59D990] border border-[#59D990] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs md:whitespace-nowrap font-semibold rounded-full text-white">
          {transformStatus(status)}
        </span>
      </div>
    );
  }
  if (status === "awaiting-verification") {
    return (
      <div className={"flex gap-0 me-2 pb-2 pt-1"}>
        <div className="flex items-center bg-[#FFC700] border border-[#FFC700] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs md:whitespace-nowrap font-semibold rounded-full text-white">
          Awaiting Verification
        </span>
      </div>
    );
  }
  if (pendingStatus.includes(status)) {
    return (
      <div className={"flex gap-0 me-2 pb-2 pt-1"}>
        <div className="flex items-center bg-[#FFC700] border border-[#FFC700] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
        <span className="text-xs md:whitespace-nowrap font-semibold rounded-full text-white">
          {transformStatus(status)}
        </span>
      </div>
    );
  }
  return (
    <div className={"flex gap-0 me-2 pb-2 pt-1"}>
      <div className="flex items-center bg-[#FF1F40] border border-[#FF1F40] rounded-full h-6 w-auto max-h-4 max-w-4 min-h-4 min-w-4 outline-2 outline-red-500 p-0 m-0 mr-2"></div>
      <span className="text-xs md:whitespace-nowrap font-semibold rounded-full text-white">
        {transformStatus(status)}
      </span>
    </div>
  );
};

export default OrderStatus;
