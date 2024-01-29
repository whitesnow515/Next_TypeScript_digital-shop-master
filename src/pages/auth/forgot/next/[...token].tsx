import React from "react";

import axios from "axios";
import jwt from "jsonwebtoken";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";

import Alert from "@components/Alert";
import CardPage from "@components/CardPage";
import Field from "@components/Field";
import FormButton from "@components/FormButton";
import PasswordStrengthBar from "@components/passwordstrength";
import getUserModel from "@models/user";

const Token = ({
  error,
  token,
  message,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const [err, setErr] = React.useState(message as string);
  const [inf, setInf] = React.useState(message as string);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [passwordError, setPasswordError] = React.useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);

  return (
    <>
      <CardPage title={"Reset Password"}>
        {error ? (
          <p className="text-red-500">{message}</p>
        ) : (
          <>
            {err && err !== "" && (
              <>
                <Alert
                  type={"error"}
                  dismissible={true}
                  onDismiss={() => {
                    setErr("");
                  }}
                >
                  {err}
                </Alert>
              </>
            )}
            {inf && inf !== "" && (
              <>
                <Alert
                  type={"success"}
                  dismissible={true}
                  onDismiss={() => {
                    setInf("");
                  }}
                >
                  {inf}
                </Alert>
              </>
            )}
            <Field
              id={"password"}
              name={"password"}
              type={"password"}
              error={passwordError}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              textChildren={<PasswordStrengthBar password={password} />}
            >
              New Password
            </Field>
            <Field
              id={"confirmPassword"}
              name={"confirmPassword"}
              type={"password"}
              error={confirmPasswordError}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
              }}
            >
              Confirm Password
            </Field>
            <FormButton
              type="submit"
              onClickLoading={(e) => {
                e.preventDefault();
                if (password !== confirmPassword) {
                  setConfirmPasswordError(true);
                  setPasswordError(true);
                  setErr("Passwords do not match!");
                  return Promise.resolve();
                }
                return axios
                  .post(`/api/auth/reset/continue/`, {
                    password,
                    token,
                  })
                  .then((res) => {
                    if (res.data.error) {
                      setErr(res.data.message);
                    } else {
                      router.push(`/auth/signin?info=${res.data.message}`);
                    }
                  })
                  .catch((er) => {
                    if (er.response) {
                      setErr(er.response.data.message);
                    } else {
                      setErr("An unknown error occurred!");
                    }
                  });
              }}
            >
              Submit
            </FormButton>
          </>
        )}
      </CardPage>
    </>
  );
};

export default Token;

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
    const { email, id } = decodedToken;
    const UserModel = await getUserModel();
    const user = await UserModel.findOne({
      _id: id,
      email,
    }).exec();
    if (!user) {
      return {
        props: {
          error: true,
          message: "User not found!",
        },
      };
    }
    return {
      props: {
        error: false,
        message: "",
        token: tokenString,
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
