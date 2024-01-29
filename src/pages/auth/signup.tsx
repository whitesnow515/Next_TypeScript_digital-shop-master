import React, { useState } from "react";

import axios from "axios";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { getCsrfToken, getProviders } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import Alert from "@components/Alert";
import CaptchaWidget from "@components/captcha/CaptchaWidget";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import PasswordStrengthBar from "@components/passwordstrength";
import { Meta } from "@components/templates/Meta";

export default function SignIn({
  csrfToken,
  error,
  captchaKey,
  captchaDummy,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [err, setErr] = useState(error as string);
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [submitting, setIsSubmitting] = React.useState(false);
  const [buttonDisabled, setButtonDisabled] = React.useState(true);

  const router = useRouter();
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const passwordConfirm = event.target.passwordConfirm.value;
    if (password !== passwordConfirm) {
      setErr("Passwords do not match.");
      return;
    }
    const hcaptchaResponse = event.target["cf-turnstile-response"]?.value ?? "";
    if (hcaptchaResponse === "") {
      setErr("Please complete the captcha. (1)");
      if (typeof window !== "undefined") {
        window.turnstile.render(document.getElementById("captcha")); // render captcha in case it didn't render+
      }
      return;
    }
    setLoading(true);

    axios
      .post("/api/auth/signup/", {
        email: event.target.email.value,
        username: event.target.username.value,
        password,
        "cf-turnstile-response": hcaptchaResponse,
      })
      .then((res) => {
        setIsSubmitting(false);
        window.turnstile.reset();
        if (res.data.error) {
          setErr(res.data.message);
        } else {
          if (!res.data.success) {
            const msg = res.data.message;
            setErr(
              msg === "The response parameter (verification token) is missing."
                ? "Please complete the captcha."
                : msg
            );
            return;
          }
          router.push(`/auth/signin?info=${res.data.message}`);
        }
      })
      .catch((e) => {
        setIsSubmitting(false);
        if (e.response) {
          setErr(e.response.data.message);
          // if (e.response.data.data) {
          //  log("Data", e.response.data.data);
          // }
        } else {
          setErr("An error occurred. Please try again later.");
        }
        if (typeof window !== "undefined") {
          window.turnstile.reset();
        }
      })
      .finally(() => {
        setLoading(false);
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <Meta title={`Sign up`} description={"Sign up for an account"} />

      <CardPage title={"Sign up"} className="sm:max-w-[500px]">
        {err && err !== "" && (
          <>
            <Alert
              type="error"
              dismissible={true}
              onDismiss={() => {
                setErr("");
              }}
            >
              {err}
            </Alert>
          </>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            setIsSubmitting(true);
            handleSubmit(e);
          }}
        >
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
          <div>
            <label
              htmlFor="email"
              className="block mb-2 xl:text-lg font-normal text-white"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="outline-none hover-circle border sm:text-sm lg:text-[18px] lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF] duration-150"
              placeholder="hello@email.com"
              required={true}
            ></input>
          </div>
          <div>
            <label
              htmlFor="username"
              className="block mb-2 xl:text-lg font-normal text-white"
            >
              Username
            </label>
            <input
              type="username"
              name="username"
              id="username"
              className="outline-none hover-circle border sm:text-sm lg:text-[18px] lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
              placeholder="BobTheBuilder"
              required={true}
            ></input>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-3 xl:text-lg font-normal text-white"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="New Password"
              className="outline-none hover-circle border sm:text-sm lg:text-[18px] lg:leading-[22px] rounded-lg block w-full px-[17px] py-4 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
              required={true}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            ></input>
            <PasswordStrengthBar password={password} />
          </div>
          <div>
            <label
              htmlFor="passwordConfirm"
              className="block mb-2 xl:text-lg font-normal text-white"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="passwordConfirm"
              id="passwordConfirm"
              placeholder="*************"
              className="outline-none hover-circle border sm:text-sm lg:text-[18px] lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
              required={true}
            ></input>
          </div>
          <CaptchaWidget
            captchaKey={captchaKey as string}
            flexCenter
            dummy={captchaDummy}
            onVerify={() => {
              setButtonDisabled(false);
            }}
          />
          <FormButton
            type={"submit"}
            loading={loading}
            disabled={buttonDisabled}
            className="font-extrabold text-2xl hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] px-4 text-center rounded-full flex items-center gap-1 justify-center w-full h-[40px] sm:h-[48px]"
          >
            Create account
          </FormButton>
          <div className="flex items-center justify-center gap-1 pb-3">
            <span className="text-base hover-circle hover:cursor-pointer font-medium text-white float-left">
              Already have an account?
            </span>
            <a href="/auth/signin">
              <span className="text-base hover:cursor-pointer hover-circle font-medium hover:underline text-[#3B71CAEE] float-right">
                Sign in
              </span>
            </a>
          </div>
        </form>
      </CardPage>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  const csrfToken = await getCsrfToken(context);
  const { error } = context.query;
  const captchaKey = process.env.CAPTCHA_SITE_KEY;

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/" } };
  }

  const providers = await getProviders();

  return {
    props: {
      providers: providers ?? [],
      csrfToken: csrfToken ?? "wtf csrf is broken lol",
      error: error ?? "",
      captchaKey: captchaKey ?? "",
      captchaDummy: Math.random(),
    },
  };
}
