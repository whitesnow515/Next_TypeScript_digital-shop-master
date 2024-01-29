import * as React from "react";
import { useEffect } from "react";

import jwt from "jsonwebtoken";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { signIn } from "next-auth/react";

import { toJwtObject } from "@app-types/models/user";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import getUserModel from "@models/user";
import Checked from "../../../../../public/assets/images/thanks.png"
import Link from "next/link";
import TopTitle from "@components/typography/TopTitle";

const VerifyEmail = ({
  error,
  message,
  user,
  refreshToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  useEffect(() => {
    if (!error) {
      signIn("update-user", {
        refreshToken,
        redirect: false,
      }).then();
    }
  }, [error, refreshToken, user]);
  return (
    <>
      <Meta title={`Verify Email`} description={"Verify your email"} />
      <CardPage title={""} className="max-w-[718px] xl:h-[638px] flex items-center justify-center hover:border-white">
        <div className="flex items-center justify-center">
          <img alt="checked" src={Checked.src} className="flex items-center justify-center mx-auto w-[30px] lg:w-auto" />
        </div>
        <TopTitle title="Thank you" style="text-center text-white flex items-center justify-center" />
        <div className="flex flex-col items-center justify-center min-w-[510px] max-w-[510px] mx-auto w-full">
          {error ? (
          <p className="text-red-500 text-center">{message}</p>
          ) : (
          <p className="text-green-500 text-center">{message}</p>
          )}
          <div className="flex items-center justify-center w-full gap-5 mt-[41px]">
            <Link href={`/`} className="flex items-center justify-center text-center bg-white rounded-xl py-4 h-10 lg:h-[59px] w-full text-base lg:text-xl">
              View Status
            </Link>
            <Link href="/" className="flex items-center justify-center text-center bg-white rounded-xl py-4 px-5 h-10 lg:h-[59px] w-full text-base lg:text-xl">
              Home
            </Link>
          </div>
        </div>
      </CardPage>
    </>
  );
};

export default VerifyEmail;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { token } = context.query;
  if (!token) {
    return {
      props: {
        error: true,
        message: "No token provided!",
        token: "",
      },
    };
  }
  try {
    const tokenString = token[0] as string;
    const decodedToken = jwt.verify(
      tokenString,
      `${process.env.NEXTAUTH_SECRET}`
    );
    // @ts-ignore - These properties exist
    const { id, email, use } = decodedToken;
    const newAccount = use === "verify_new";
    const UserModel = await getUserModel();
    const user: any = await UserModel.findOne({
      _id: id,
    }).exec();
    if (!user) {
      return {
        props: {
          error: true,
          message: "User not found!",
          token: "",
        },
      };
    }
    if (newAccount) {
      if (user.emailVerified) {
        // if this is a new account, and the email is already verified, then we don't want to verify it again
        return {
          props: {
            error: true,
            message: "Email already verified!",
            token: "",
          },
        };
      }
    }
    if (use === "verify_existing") {
      user.email = email;
    }
    user.emailVerified = new Date();
    await user.save();

    const userObject = toJwtObject(user) as any;

    const refreshTokenObject = {
      id: userObject.id,
      email: userObject.email,
      username: userObject.username,
      use: "refresh",
      origin: "verify-email",
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
        message: "Successfully verified your email!",
        user: userObject,
        newAccount,
        refreshToken,
      },
    };
  } catch (err) {
    // error(err);
    return {
      props: {
        error: true,
        message: "An error occurred! Please try again later.",
      },
    };
  }
}
