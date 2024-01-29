import React, { useEffect } from "react";

import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import getUserModel from "@models/user";
import { DisplayBehavior } from "@src/types";
import { AppConfig } from "@util/AppConfig";
import { getSetting } from "@util/SettingsHelper";

const SupportPage = ({
  crispUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  useEffect(() => {
    try {
      // @ts-ignore
      window.$crisp.push(["do", "chat:hide"]);
    } catch (e) {
      // do nothing
    }
  });
  return (
    <>
      <Meta title={"Support"} description={`${AppConfig.site_name} Support`} />
      <iframe
        src={crispUrl}
        className={
          "fixed top-0 left-0 bottom-0 right-0 w-full h-full m-0 p-0 overflow-hidden"
        }
      ></iframe>
      <div className={"text-white"}>
        <h1 className={"text-2xl"}>Your browser does not support iframes.</h1>
        <FormButton href={crispUrl} className={"mt-4"}>
          Click to open the page.
        </FormButton>
      </div>
    </>
  );
};

export default SupportPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supportLink = await getSetting("supportLink", "");
  if (!supportLink) {
    return {
      redirect: {
        destination: supportLink,
      },
    };
  }
  // is the user logged in
  // we want to redirect the user to https://go.crisp.chat/chat/embed/?website_id=[id] weather or not they are logged in
  const crispDisplayBehavior = (await getSetting(
    "showCrisp",
    "show-purchased"
  )) as DisplayBehavior;
  if (crispDisplayBehavior === "never") {
    return {
      redirect: {
        destination: "/",
      },
    };
  }
  const session = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  let user;
  if (session) {
    const UserModel = await getUserModel();
    user = await UserModel.findOne({
      username: session.user?.name,
      email: session.user?.email,
    }).exec();
  }
  const params = new URLSearchParams();
  params.append("website_id", (await getSetting("crispId", "")) || "");
  if (user) {
    if (user.email) params.append("user_email", user.email);
    if (user.username) params.append("user_nickname", user.username);
  }
  const url = `https://go.crisp.chat/chat/embed/?${params.toString()}`;
  if (crispDisplayBehavior === "show-all") {
    return {
      props: {
        crispUrl: url,
      },
    };
  }
  if (crispDisplayBehavior === "show-purchased") {
    if (user && user.showSupportButton) {
      return {
        props: {
          crispUrl: url,
        },
      };
    }
  } else if (crispDisplayBehavior === "show-logged-in") {
    if (user) {
      return {
        props: {
          crispUrl: url,
        },
      };
    }
  }
  return {
    redirect: {
      destination: "/",
    },
  };
}
