import React, { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getSession, signIn, useSession } from "next-auth/react";
import Swal from "sweetalert2";

import Modal from "@components/admin/Modal";
import Alert from "@components/Alert";
import AppWrapper from "@components/AppWrapper";
import AvatarUploader from "@components/avatar/AvatarUploader";
import CaptchaWidget from "@components/captcha/CaptchaWidget";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import PasswordStrengthBar from "@components/passwordstrength";
import { Meta } from "@components/templates/Meta";
import { error as errorLog, log } from "@util/log";
import Enable2FA from "@components/modal/Enable2FA";
import getUserModel from "@models/user";
import { ShieldCheck } from "phosphor-react";
import TopUp from "@components/layout/TopUp";
import UserPanelLayout from "@components/templates/UserPanelLayout";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";

const Profile = ({
  error,
  info,
  captchaKey,
  twofactor_verified,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [password, setPassword] = useState<string>("");
  const session = useSession();
  const [inf, setInfo] = useState<string>(info as string);
  const [err, setError] = useState<string>(error as string);
  const [balance, setBalance] = useState<number>(0);
  const [verifyEmailSent, setVerifyEmailSent] = React.useState("NOT_SENT"); // NOT_SENT, SENT, error text
  const [showEmailVerificationCaptcha, setShowEmailVerificationCaptcha] =
    useState(false);
  const snackbar = useSnackbar();
  const router = useRouter();
  const [updateEmailLoading, setUpdateEmailLoading] = useState<boolean>(false);
  const [submit, setSubmit] = useState<boolean>(false);
  const [topup, setTopup] = useState<boolean>(false);
  const [verified, setVerified] = useState(false);
  const [stage, setStage] = React.useState<"qr" | "validate">("qr");
  const [changePasswordLoading, setChangePasswordLoading] =
    useState<boolean>(false);
  const [open, setOpen] = React.useState<boolean>();

  useEffect(() => {
    axios
      .get("/api/user/balance/")
      .then((res) => {
        setBalance(res.data?.balance || 0);
      })
      .catch((eX) => {
        errorLog(eX);
        setBalance(-1);
      });
  }, []);
  const submitPassword = (e: any) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    const hcaptchaResponse =
      e.target["cf-turnstile-response"]?.value ?? undefined;
    if (!hcaptchaResponse) {
      // @ts-ignore - this is run on the client side
      window.turnstile.render(document.getElementById("passwordCaptcha"), {
        callback: () => {
          submitPassword(e);
        },
      });
      return;
    }
    const oldPassword = e.target.oldPassword.value;
    axios
      .post("/api/user/update/password/", {
        currentPassword: oldPassword,
        newPassword: password,
        "cf-turnstile-response": hcaptchaResponse,
      })
      .then((res) => {
        log(res);
        if (res.data?.success) {
          setInfo(res.data.message);
          const { refreshToken } = res.data;
          if (refreshToken) {
            signIn("update-user", {
              refreshToken,
              redirect: false,
            }).then(() => {});
            snackbar.enqueueSnackbar(res.data.message, {
              variant: "success",
            });
          }
        } else {
          snackbar.enqueueSnackbar(res.data.message, {
            variant: "error",
          });
          setError(res.data.message);
        }
      })
      .catch((errorRes) => {
        log(errorRes);
        snackbar.enqueueSnackbar(errorRes.response.data.message, {
          variant: "error",
        });
        if (errorRes.response) {
          setError(errorRes.response.data.message);
        }
      })
      .finally(() => {
        setChangePasswordLoading(false);
      });
  };
  const submitAvatar = (e: any) => {
    e.preventDefault();
    const file = e.target.avatarUpload.files[0];
    if (!file) {
      setError("No file selected");
      return;
    }
    const config = {
      headers: { "content-type": "multipart/form-data" },
      onUploadProgress: (event: any) => {
        log(
          `Current progress:`,
          Math.round((event.loaded * 100) / event.total)
        );
      },
    };
    const formData = new FormData();
    formData.append("files", file);
    axios
      .post("/api/user/update/avatar", formData, config)
      .then((res) => {
        log(res);
        if (res.data?.success) {
          setInfo(res.data.message);
          const { refreshToken } = res.data;
          if (refreshToken) {
            signIn("update-user", {
              refreshToken,
              redirect: false,
            }).then(() => {});
          }
          snackbar.enqueueSnackbar(res.data.message, {
            variant: "success",
          });
        } else {
          setError(res.data.message);
        }
      })
      .catch(() => {
        snackbar.enqueueSnackbar(
          "An error occurred while uploading your avatar",
          {
            variant: "error",
          }
        );
        setError("An error occurred while uploading your avatar");
      });
  };
  const submitEmail = (e: any) => {
    setUpdateEmailLoading(true);
    e.preventDefault();
    const email = e.target.email.value;

    const hcaptchaResponse =
      e.target["cf-turnstile-response"]?.value ?? undefined;
    if (!hcaptchaResponse) {
      // @ts-ignore - this is run on the client side
      window.turnstile.render(document.getElementById("emailCaptcha"), {
        callback: (token: any) => {
          submitEmail(e);
        },
      });
      return;
    }
    axios
      .post("/api/user/update/email", {
        email,
        "cf-turnstile-response": hcaptchaResponse,
      })
      .then((res) => {
        log(res);
        if (res.data?.success) {
          setInfo(res.data.message);
          const { refreshToken } = res.data; // not needed rn as we need to verify the email, but its here
          if (refreshToken) {
            signIn("update-user", {
              refreshToken,
              redirect: false,
            }).then(() => {});
          }
          snackbar.enqueueSnackbar(res.data.message, {
            variant: "success",
          });
        } else {
          setError(res.data.message);
        }
      })
      .catch((errorRes) => {
        if (errorRes.response) {
          snackbar.enqueueSnackbar(errorRes.response.data.message, {
            variant: "error",
          });
          setError(errorRes.response.data.message);
        }
      })
      .finally(() => {
        // clean up captcha
        // @ts-ignore - this is run on the client side
        window.turnstile.remove();
        setUpdateEmailLoading(false);
      });
  };

  const handledisable2FA = async () => {
    if (submit) {
      return;
    }
    setSubmit(true);

    await axios
      .post(`/api/user/2fa/disable`)
      .then((res) => {
        setVerified(false);
        setStage("qr");
        snackbar.enqueueSnackbar(res.data.message, {
          variant: "success",
        });
        router.replace(router.asPath);
      })
      .catch((err) => {
        snackbar.enqueueSnackbar("Something went wrong. Try again later.", {
          variant: "error",
        });
        setSubmit(false);
      });
  };
  return (
    <UserPanelLayout title={`Profile`} description={"Profile"}>
      <Enable2FA
        open={open as boolean}
        verified={verified}
        setStage={setStage}
        stage={stage}
        setVerified={setVerified}
        setOpen={setOpen}
      />
      <TopUp open={topup as boolean} setOpen={setTopup} />
      <div className="antialiased text-gray-600">
        {session &&
          verifyEmailSent === "NOT_SENT" &&
          session.status === "authenticated" && // we want to render this after the session is loaded
          session.data &&
          // @ts-ignore
          !session.data.emailVerified && (
            <div className={"mx-auto"}>
              <Modal
                id={"captcha-modal"}
                title={"Please complete the captcha."}
                description={"It may take a few seconds to load."}
                buttons={<></>}
              >
                {showEmailVerificationCaptcha && (
                  <CaptchaWidget
                    className={"pt-4"}
                    captchaKey={captchaKey || ""}
                    onVerify={(token) => {
                      document
                        .getElementById("captcha-modal")
                        ?.classList.add("hidden");
                      Swal.fire({
                        title: "Sending email...",
                        didOpen: () => {
                          Swal.showLoading();
                        },
                      });
                      axios
                        .post(
                          "/api/email/resend",
                          {
                            emailName: "email_verify",
                            "cf-turnstile-response": token,
                          },
                          {
                            withCredentials: true,
                          }
                        )
                        .then((res) => {
                          if (res.data.success) {
                            setVerifyEmailSent("SENT");
                          } else {
                            setVerifyEmailSent(res.data.message);
                          }
                          Swal.fire({
                            title: res.data.success
                              ? "Email sent!"
                              : "Error sending email",
                            text: res.data.message,
                            icon: res.data.success ? "success" : "error",
                          });
                        });
                    }}
                  />
                )}
              </Modal>
              <Alert
                type={"error"}
                dismissible={false}
                button={
                  <FormButton
                    className="outline-none whitespace-nowrap shrink-0 focus:ring-[white] duration-300 hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center w-full focus:bg-gray-600"
                    style={
                      "flex items-center justify-center px-[1rem] py-[.5rem]"
                    }
                    onClick={() => {
                      setShowEmailVerificationCaptcha(true);
                      document
                        .getElementById("captcha-modal")
                        ?.classList.remove("hidden");
                    }}
                  >
                    Resend Email
                  </FormButton>
                }
              >
                Your email is not verified.
                <p className={"text-xs text-gray-400 w-[100%]"}>
                  If you have verified and still see this message, please
                  <a
                    href={"/auth/refresh?backUrl=%2Fprofile"}
                    className={"pl-1 text-white"}
                  >
                    Click Here
                  </a>
                </p>
              </Alert>
            </div>
          )}
        {verifyEmailSent !== "NOT_SENT" && (
          <div className={"mx-auto"}>
            <Alert
              type={verifyEmailSent === "SENT" ? "success" : "error"}
              dismissible={true}
            >
              {verifyEmailSent === "SENT"
                ? "Email sent. Please check your inbox."
                : verifyEmailSent}
            </Alert>
          </div>
        )}
        <div className="mx-auto">
          <div className="">
            <h1
              className={
                "text-white text-3xl font-semibold leading-tight tracking-tight md:text-4xl pb-4 text-start"
              }
            >
              Profile
            </h1>
            {/* <h1
              className={
                "font-bold leading-tight tracking-tight md:text-2xl text-white pb-4 text-start"
              }
            >
              {(session.data as any)?.username}
            </h1> */}
            {/* <div className={"mx-8"}>
              {inf && (
                <Alert type={"info"} dismissible>
                  {inf}
                </Alert>
              )}
              {err && (
                <Alert type={"error"} dismissible>
                  {err}
                </Alert>
              )}
            </div> */}
          </div>
          <div className="">
            {session.data ? (
              <>
                <Grid container className="flex mb-3" spacing={2}>
                  <Grid
                    className="flex flex-col justify-between gap-3"
                    item
                    xs={12}
                    md={4}
                  >
                    <Card>
                      <div className="h-auto mt-2 flex flex-col justify-between">
                        <div className="">
                          <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                            2FA Authentication
                          </h1>
                          <p className={"text-white text-sm"}>
                            {twofactor_verified
                              ? "Your account is secured with two-factor authentication"
                              : "You currently don't have two-factor authentication enabled"}
                          </p>
                        </div>

                        {twofactor_verified ? (
                          <>
                            <FormButton
                              onClick={handledisable2FA}
                              className="font-bold hover:cursor-pointer bg-[#303633] hover:bg-[#4A524E] text-white mt-2 text-sm text-center rounded-full flex items-center gap-3 justify-center w-full px-6 py-1.5"
                            >
                              Disable 2FA
                            </FormButton>
                          </>
                        ) : (
                          <FormButton
                            onClick={() => setOpen(true)}
                            type={"submit"}
                            className="outline-none mt-4 whitespace-nowrap shrink-0 focus:ring-[white] duration-300 hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center w-full focus:bg-gray-600"
                          >
                            Setup
                          </FormButton>
                        )}
                      </div>
                    </Card>
                    <Card>
                      <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                        Balance: $
                        {balance >= 0
                          ? balance.toFixed(2)
                          : balance === -1
                          ? (0).toFixed(2)
                          : "Loading..."}
                      </h1>
                      <FormButton
                        onClick={() => setTopup(true)}
                        type={"submit"}
                        className="outline-none mt-4 whitespace-nowrap shrink-0 focus:ring-[white] duration-300 hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center w-full focus:bg-gray-600"
                      >
                        + Add Balance
                      </FormButton>
                    </Card>
                    <Card>
                      <form className="" onSubmit={submitEmail}>
                        <div className={"pt-4"}>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={(session?.data as any)?.email}
                            className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
                            placeholder="hello@example.com"
                            required={true}
                          ></input>
                        </div>
                        <CaptchaWidget
                          id={"emailCaptcha"}
                          autoRender={false}
                          captchaKey={captchaKey as string}
                        />
                        <FormButton
                          className="outline-none mt-4 whitespace-nowrap shrink-0 focus:ring-[white] duration-300 hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center w-full focus:bg-gray-600"
                          type={"submit"}
                          loading={updateEmailLoading}
                        >
                          Update Email
                        </FormButton>
                      </form>
                    </Card>
                  </Grid>

                  <Grid className="shrink-0 h-full" item xs={12} md={4}>
                    <Card>
                      <form
                        className="flex flex-col gap-6"
                        onSubmit={submitPassword}
                      >
                        <div>
                          <label
                            htmlFor="oldPassword"
                            className="block mb-2 mt-4 text-sm font-medium text-white"
                          >
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="oldPassword"
                            id="oldPassword"
                            placeholder="•••••••••••••"
                            className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
                            required={true}
                          ></input>
                        </div>
                        <div>
                          <label
                            htmlFor="password"
                            className="block mb-2 text-sm font-medium text-white"
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
                            onChange={(e) => {
                              setPassword(e.target.value);
                            }}
                          ></input>
                          <div className="mt-3">
                            <PasswordStrengthBar password={password} />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="passwordConfirm"
                            className="block mb-2 text-sm font-medium text-white"
                          >
                            Password Confirmation
                          </label>
                          <input
                            type="password"
                            name="passwordConfirm"
                            id="passwordConfirm"
                            placeholder="••••••••••••••••"
                            className="outline-none hover-circle border sm:text-sm lg:text-base lg:leading-[22px] rounded-lg block w-full px-[17px] py-3 bg-transparent border-[#393F3C] hover:border-[#66736D] placeholder-white/40 text-white focus:border-[#FFFFFF]"
                            required={true}
                          ></input>
                        </div>
                        <CaptchaWidget
                          id={"passwordCaptcha"}
                          captchaKey={captchaKey as string}
                          autoRender={false}
                        />
                        <FormButton
                          type={"submit"}
                          loading={changePasswordLoading}
                          className="outline-none font-bold whitespace-nowrap shrink-0 focus:ring-[white] duration-300 hover:cursor-pointer bg-[#FF1F40] hover:bg-[#BE0924] text-white py-[7px] text-sm px-4 text-center rounded-full flex items-center gap-3 justify-center w-full focus:bg-gray-600"
                        >
                          Change Password
                        </FormButton>
                      </form>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white text-center">
                  Loading...
                </h1>
              </>
            )}
          </div>
        </div>
      </div>
    </UserPanelLayout>
  );
};

export default Profile;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { error, info } = context.query;
  let { id } = (await getSession(context)) as any;
  const UserModel = await getUserModel();

  const user: any = await UserModel.findById(id);
  return {
    props: {
      error: error ?? "",
      info: info ?? "",
      captchaKey: process.env.CAPTCHA_SITE_KEY,
      twofactor_verified:
        user && user.twofactor_verified ? user.twofactor_verified : false,
    },
  };
}
