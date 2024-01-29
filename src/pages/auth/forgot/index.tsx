import React from "react";

import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import Alert from "@components/Alert";
import CaptchaWidget from "@components/captcha/CaptchaWidget";
import CardPage from "@components/CardPage";
import Field from "@components/Field";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";

export default function Index({
  captchaKey,
  error,
  info,
  captchaDummy,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [err, setErr] = React.useState(error as string);
  const [inf, setInf] = React.useState(info as string);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const email = event.target.email.value;
    const hcaptchaResponse = event.target["cf-turnstile-response"]?.value ?? "";
    if (hcaptchaResponse === "") {
      setErr("Please complete the captcha. (1)");
      return;
    }
    setLoading(true);
    axios
      .post("/api/auth/reset/", {
        email,
        "cf-turnstile-response": hcaptchaResponse,
      })
      .then((res) => {
        if (res.data.error) {
          setErr(res.data.message);
        } else {
          setInf(res.data.message);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (e?.response?.data?.message) {
          setErr(e.response.data.message);
        } else {
          setErr("An unknown error occurred. Please try again later.");
        }
        setLoading(false);
      })
      .finally(() => {
        if (typeof window !== "undefined") {
          window.turnstile.reset();
        }
        setLoading(false);
      });
  };

  return (
    <div>
      <Meta
        title={`Password Recovery`}
        description={"Recover your password in case you forgot it"}
      />

      <CardPage title={"Password Recovery"}>
        {err && err !== "" && (
          <>
            <Alert
              type={"error"}
              dismissible={true}
              onDismiss={() => setErr("")}
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
              onDismiss={() => setInf("")}
            >
              {inf}
            </Alert>
          </>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Field id={"email"} name={"email"} type={"email"}>
            Email
          </Field>
          <div className="flex justify-center">
            <CaptchaWidget
              captchaKey={captchaKey as string}
              dummy={captchaDummy}
            />
          </div>
          <FormButton type={"submit"} loading={loading}>
            Submit
          </FormButton>
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
  const { error, info } = context.query;

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/" } };
  }

  return {
    props: {
      error: error ?? "",
      info: info ?? "",
      captchaKey: process.env.CAPTCHA_SITE_KEY,
      captchaDummy: Math.random(),
    },
  };
}
