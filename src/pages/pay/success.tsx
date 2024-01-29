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
import Checked from "../../../public/assets/images/thanks.png"
import TopTitle from "@components/typography/TopTitle";
import Link from "next/link";
const SuccessPage = ({
  refreshToken,
  orderId,
  error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  useEffect(() => {
    if (!error) {
      signIn("update-user", {
        refreshToken,
        redirect: false,
      }).then(() => { });
    }
  }, [refreshToken]);
  return (
    <>
      <Meta title={"Thank You!"} description={""} />
      <CardPage title={""} className="max-w-[718px] xl:h-[638px] flex items-center justify-center hover:border-white">
        <div className="flex items-center justify-center">
          <img alt="checked" src={Checked.src} className="flex items-center justify-center mx-auto w-[30px] lg:w-auto" />
        </div>
        <TopTitle title="Thank you" style="text-center text-white flex items-center justify-center" />
        <CrispComponent />
        <div className="flex flex-col items-center justify-center max-w-[510px] mx-auto w-full">
          <p className="text-white text-base text-center">
            Your order has been successfully processed.
          </p>
          <span className="text-white text-center mt-[9px]">
            You can see your products under the Orders page. You will also receive
            an email with your order details. Thank you for your purchase!
          </span>
          <div className="flex items-center justify-center w-full gap-5 mt-[41px]">
            <Link href={`/orders/${orderId}`} className="flex items-center justify-center text-center bg-white rounded-xl py-4 h-10 lg:h-[59px] w-full text-base lg:text-xl">
              View Status
            </Link>
            <Link href="/products" className="flex items-center justify-center text-center bg-white rounded-xl py-4 h-10 lg:h-[59px] w-full text-base lg:text-xl">
              Browse Products
            </Link>
          </div>
        </div>

      </CardPage>
    </>
  );
};

export default SuccessPage;

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
