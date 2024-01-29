"use client";

import React from "react";

import { FaEdit } from "react-icons/fa";

import Avatar from "@components/avatar/Avatar";

import { Button } from "../Button";

type AdminUserPropsInterface = {
  id: string;
  username: string;
  email: string;
  verified: string;
  roles: string[];
  image: string | undefined;
  color: "purple" | "black";
};

const User = (props: AdminUserPropsInterface) => {
  return (
    <>
      <a href={`/admin/users/${props.id}`}>
        <div
          className={`text-gray-100 rounded-lg py-2 mb-5 px-5 ${
            props.color === "purple" ? "bg-primary-800" : "bg-gray-800"
          }`}
        >
          <div className="inline-block mr-5 h-full align-middle">
            <Avatar src={props.image!} />
          </div>
          <div className="inline-block align-middle h-full">
            <p className="text-xl">{props.username}</p>
            <span className="text-base text-gray-400 mr-2">
              {props.email} - {props.verified}
            </span>
            ·
            <span className="text-base text-gray-400 ml-2">
              Roles: {props.roles.join(", ")}
            </span>
          </div>
          <div className="float-right align-middle p-1">
            <Button icon={FaEdit}>Edit</Button>
          </div>
        </div>
      </a>
    </>
  );
};

export default User;
