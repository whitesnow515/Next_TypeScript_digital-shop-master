import React, { useEffect } from "react";

import jwt from "jsonwebtoken";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { signIn } from "next-auth/react";

import { toJwtObject } from "@app-types/models/user";
import CardPage from "@components/CardPage";
import CrispComponent from "@components/CrispComponent";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { resolveOrder } from "@models/order";
import getUserModel from "@models/user";

const WaitPage = ({
  refreshToken,
  orderId,
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
      <Meta title={"Thank You!"} description={""} />
      <CardPage title={"Thank You!"}>
        <CrispComponent />
        <p className="text-white">
          Your order has been successfully processed, and is now awaiting
          verification.
        </p>
        <p className="text-white">
          You will receive an email when your order has been verified.
        </p>
        <p className="text-white">Thank you for your purchase!</p>
        <FormButton href={`/orders/${orderId}`} className={"mt-4"}>
          View Order{orderId !== "" ? "" : "s"}
        </FormButton>
      </CardPage>
    </>
  );
};

export default WaitPage;

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
