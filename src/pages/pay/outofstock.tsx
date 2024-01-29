import React, { useEffect } from "react";

import jwt from "jsonwebtoken";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { signIn } from "next-auth/react";

import { toJwtObject } from "@app-types/models/user";
import CardPage from "@components/CardPage";
import CrispComponent from "@components/CrispComponent";
import { Meta } from "@components/templates/Meta";
import { resolveOrder } from "@models/order";
import getUserModel from "@models/user";

const OutOfStockPage = ({
  refreshToken,
  error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  useEffect(() => {
    if (!error) {
      signIn("update-user", {
        refreshToken,
        redirect: false,
      }).then(() => {});
    }
  }, [refreshToken]);
  return (
    <>
      <Meta title={"Out of stock"} description={""} />
      <CrispComponent forceShow />
      <CardPage title={"Sorry!"}>
        <p className="text-white">
          We ran out of stock while processing your order!
        </p>
        <p className="text-white">
          Please contact support with the button on the bottom right to get a
          refund.
        </p>
        <p className="text-white">Sorry for the inconvenience!</p>
      </CardPage>
    </>
  );
};

export default OutOfStockPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { orderId } = context.query;
  const order = await resolveOrder(orderId as string);
  if (!order) {
    return {
      notFound: true,
    };
  }
  if (!order.user) {
    return {
      props: {
        orderId: orderId || "",
      },
    };
  }
  const UserModel = await getUserModel();
  const user: any = await UserModel.findById(order.user);
  if (!user) {
    return {
      props: {
        orderId: orderId || "",
      },
    };
  }
  const userObject = toJwtObject(user);
  const refreshTokenObject = {
    id: userObject.id,
    email: userObject.email,
    username: userObject.username,
    use: "refresh",
    origin: "refresh-pay-success",
  };
  const refreshToken = jwt.sign(
    refreshTokenObject,
    `${process.env.NEXTAUTH_SECRET}`,
    {
      expiresIn: "1m",
    }
  );
  return {
    props: {
      error: false,
      message: "Refreshing session...",
      user: userObject,
      refreshToken,
      orderId: orderId || "",
    },
  };
}
