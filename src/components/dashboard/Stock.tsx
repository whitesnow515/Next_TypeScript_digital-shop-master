import React from "react";

interface StockPropsInterface {
  stockId: string;
  number: number;
  fileName: string;
  color: "purple" | "black";
  replacement: boolean;
}

const Stock = (props: StockPropsInterface) => {
  return (
    <a
      href={`/stock/${props.stockId}/`}
      className={`text-gray-100 rounded-lg py-2 mb-5 px-5 ml-4 ${
        props.color === "purple" ? "bg-primary-800" : "bg-gray-800"
      } cursor-pointer`}
    >
      <div className="w-full flex flex-col justify-center mr-5 h-full align-middle">
        <p className="text-xl flex justify-center">
          {props.number === 1
            ? "Order"
            : `${props.replacement ? "Replacement" : "Download"} #${
                props.number - 1
              }`}
        </p>
        <p className="text-base text-gray-400 flex justify-center">
          {props.fileName}
        </p>
        {/* props.replacement && (
          <p className="text-base text-gray-500 flex justify-center">
            (Replacement)
          </p>
        ) */}
        <p className="text-base text-gray-400 flex justify-center">
          Click to view
        </p>
      </div>
    </a>
  );
};

export default Stock;
