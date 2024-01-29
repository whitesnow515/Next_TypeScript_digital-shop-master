import React from "react";

import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth/next";
import { getCsrfToken, getProviders, signIn } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import Alert from "@components/Alert";
import CaptchaWidget from "@components/captcha/CaptchaWidget";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";

export default function SignIn({
  /* providers, */ csrfToken,
  error,
  info,
  captchaKey,
  captchaDummy,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [loading, setLoading] = React.useState(false);
  const [submitting, setIsSubmitting] = React.useState(false);
  const [err, setErr] = React.useState(error as string);
  const [inf /* , setInf */] = React.useState(info as string);
  const [otp, setOtp] = React.useState<string>();

  const [buttonDisabled, setButtonDisabled] = React.useState(true);

  return (
    <div>
      <Meta title={`Sign in`} description={"Sign into your account"} />

      <CardPage title={"Sign in"} className="bg-[#141716] sm:max-w-[500px]">
        {err && err !== "" && (
          <>
            <Alert type="error" dismissible={true}>
              {err === "CredentialsSignin"
                ? "Invalid credentials"
                : err === "Default"
                ? "An error occurred"
                : err}
            </Alert>
          </>
        )}
        {inf && inf !== "" && (
          <>
            <Alert type="success" dismissible={true}>
              {inf}
            </Alert>
          </>
        )}
        <form
          className="space-y-4"
          // action="/api/auth/callback/credentials"
          id={"signin-form"}
          onSubmit={async (e) => {
            if (submitting) {
              return;
            }

            e.preventDefault();
            setIsSubmitting(true);
            const email = e.currentTarget.email.value;
            const password = e.currentTarget.password.value;
            setLoading(true);

            async function submit(captchaToken: string) {
              await signIn("credentials", {
                email,
                password,
                code: otp,
                "cf-turnstile-response": captchaToken,
              }).finally(() => {
                setLoading(false);
                setIsSubmitting(false);
              });
            }

            const captchaToken = e.currentTarget["cf-turnstile-response"].value;
            if (!captchaToken) {
              setErr("Please complete the captcha");
              if (typeof window !== "undefined") {
                window.turnstile.reset();
                window.turnstile.render(document.getElementById("captcha"), {
                  sitekey: captchaKey as string,
                  callback: async (token: string) => {
                    if (token) {
                      await submit(token);
                    }
                  },
                });
              }
              setLoading(false);
              setIsSubmitting(false);
              return;
            }
            await submit(captchaToken);
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
              className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
              placeholder="hello@email.com"
              required={true}
            ></input>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-2 xl:text-lg font-normal text-white"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••••••••••"
              className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
              required={true}
            ></input>
            {error === "Invalid OTP code" && (
              <>
                <label
                  htmlFor="password"
                  className="block my-3 xl:text-lg font-normal text-white"
                >
                  OTP Code
                </label>
                <input
                  minLength={6}
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP is required for 2FA"
                  className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
                ></input>
              </>
            )}
            <a href="/auth/forgot" className={"mt-6"}>
              <span className="text-sm text-[#3B71CA] hover-circle mt-[15px] hover:cursor-pointer font-medium hover:underline float-right">
                Forgot Password?
              </span>
            </a>
          </div>
          <div className="pt-8">
            <CaptchaWidget
              flexCenter
              captchaKey={captchaKey as string}
              dummy={captchaDummy}
              onVerify={() => {
                setButtonDisabled(false);
              }}
            />
          </div>
          <FormButton
            type={"submit"}
            loading={loading}
            disabled={buttonDisabled || submitting}
            className="font-bold hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-1 justify-center w-full focus:bg-gray-600 h-[40px] sm:h-[48px]"
          >
            Sign in
          </FormButton>
          <div className="flex items-center justify-center gap-1 pb-3">
            <span className="text-base hover-circle hover:cursor-pointer font-medium text-white float-left">
              Don’t have an account?{" "}
            </span>
            <a href="/auth/signup">
              <span className="text-base hover:cursor-pointer hover-circle font-medium hover:underline text-[#3B71CAEE] float-right">
                Create account
              </span>
            </a>
          </div>
        </form>
      </CardPage>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );
  const csrfToken = await getCsrfToken(context);
  const { error, info } = context.query;

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
      info: info ?? "",
      captchaKey: process.env.CAPTCHA_SITE_KEY,
      captchaDummy: Math.random(),
    },
  };
}
