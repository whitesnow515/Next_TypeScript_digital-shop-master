import React from "react";

interface CardProps {
  children: React.ReactNode;
  width?: string;
  className?: string;
  color?: "purple" | "black";
  legacy?: boolean; // old margin style
}

const Card = ({ ...props }: CardProps) => {
  return (
    <div
      className={`${
        props.legacy ? "mb-5 mr-5" : ""
      } rounded-xl bg-[#1F2421] border border-[#303633] p-4 flex-none ${props.className ? props.className : ""}`}
    >
      {props.children}
    </div>
  );
};

export default Card;
