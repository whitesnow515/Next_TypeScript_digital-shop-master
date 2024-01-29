import React, { useEffect } from "react";

import jwt from "jsonwebtoken";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { signIn, signOut } from "next-auth/react";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import { toJwtObject } from "@app-types/models/user";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";

import getUserModel from "../../models/user";

const Refresh = ({
  error,
  message,
  refreshToken,
  logoutButton,
  backUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [err] = React.useState(error as boolean);
  const [msg, setMsg] = React.useState(message as string);
  const [finished, setFinished] = React.useState(false);
  useEffect(() => {
    if (!error) {
      signIn("update-user", {
        refreshToken,
        redirect: false,
      }).then(() => {
        setMsg("Session refreshed!");
        setFinished(true);
      });
    }
  }, [refreshToken]);
  return (
    <>
      <CardPage title={"Refresh Session"}>
        {err ? (
          <>
            <p className={"text-red-500"}>{msg}</p>
            {logoutButton && (
              <FormButton
                type={"button"}
                onClick={() => {
                  signOut({ redirect: false }).then(() => {
                    window.location.href = "/auth/signin/";
                  });
                }}
              >
                Log Out
              </FormButton>
            )}
          </>
        ) : (
          <>
            <p className={"text-green-500"}>{msg}</p>
            {finished && backUrl && (
              <FormButton
                type={"button"}
                onClick={() => {
                  if (backUrl) window.location.href = backUrl;
                }}
              >
                Back
              </FormButton>
            )}
          </>
        )}
      </CardPage>
    </>
  );
};

export default Refresh;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session: any = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  if (!session)
    return {
      props: {
        error: true,
        message:
          "Invalid session! Please log out/in again, or clear your cookies!",
      },
    };
  const UserModel = await getUserModel();
  const user: any = await UserModel.findOne({
    username: session.user.name,
    email: session.user.email,
  });
  if (!user)
    return {
      props: {
        error: true,
        logoutButton: true,
        message: "Invalid user!",
      },
    };
  const userObject = toJwtObject(user);
  const refreshTokenObject = {
    id: userObject.id,
    email: userObject.email,
    username: userObject.username,
    use: "refresh",
    origin: "refresh-endpoint",
  };
  const refreshToken = jwt.sign(
    refreshTokenObject,
    `${process.env.NEXTAUTH_SECRET}`,
    {
      expiresIn: "1m",
    }
  );
  const { backUrl } = context.query;
  return {
    props: {
      error: false,
      message: "Refreshing session...",
      user: userObject,
      backUrl: (backUrl as string) ?? "",
      refreshToken,
    },
  };
}
