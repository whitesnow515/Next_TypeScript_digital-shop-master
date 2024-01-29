import React, { useState } from "react";

import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { setSettingClient } from "@util/ClientUtils";
import { error as errorLog } from "@util/log";
import { getSetting } from "@util/SettingsHelper";
import RequireRole from "@components/auth/RequireRole";

const Settings2Page = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const [cashAppIdWords, setCashAppIdWords] = useState<boolean>(
    props.defaultCashAppIdWords as boolean
  );

  const [inf, setInfo] = useState<string>(props.infAlert as string);
  const [err, setError] = useState<string>(props.errAlert as string);
  const session = useSession();
  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        <Meta
          title={`Settings - Page 2`}
          description={"View or change site settings"}
        />
        <div className={"flex w-full items-center"}>
          <div className="ml-auto">
            <FormButton href={"/admin/settings/"}>
              <FaChevronLeft />
            </FormButton>
          </div>
          <h1 className={"text-2xl flex-grow text-center"}>Settings</h1>
          <div className="ml-auto">
            <FormButton disabled>
              <FaChevronRight />
            </FormButton>
          </div>
        </div>
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
        <Grid container spacing={2} className="mb-[15px] pt-4">
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Default Image
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"image"}>Image</label>
                <input
                  type="url"
                  name="image"
                  id="image"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                  required={true}
                  defaultValue={props.defaultDefaultImage}
                />
                <span className={"text-gray-500"}>
                  The default image to use for products that do not have an
                  image
                </span>
                <FormButton
                  onClickLoading={() => {
                    const val = (
                      document.getElementById("image") as HTMLInputElement
                    ).value;
                    return setSettingClient("defaultImage", val)
                      .then(() => {
                        setInfo("Successfully updated default image!");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update Default Image
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Email Validity Check
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"api-url"}>Backend API URL</label>
                <input
                  type="url"
                  name="api-url"
                  id="api-url"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                  required={true}
                  defaultValue={props.defaultEmailBackendApiUrl}
                />
                <span className={"text-gray-500"}>
                  Checks if an email is valid. Set to empty to disable.
                </span>
                <FormButton
                  onClickLoading={() => {
                    const val = (
                      document.getElementById("api-url") as HTMLInputElement
                    ).value;
                    return setSettingClient("emailVerificationApiUrl", val)
                      .then(() => {
                        setInfo("Successfully updated backend url!");
                      })
                      .catch((eX) => {
                        errorLog(eX);
                        setError(
                          eX?.response?.data?.message || "Unknown Error"
                        );
                      });
                  }}
                  className={"mt-2"}
                >
                  Update URL
                </FormButton>
                <FormButton
                  className={"mt-2"}
                  onClick={() => {
                    Swal.fire({
                      title: "Test Email",
                      input: "email",
                      inputLabel: "Email",
                      showCancelButton: true,
                    }).then((res) => {
                      if (res.isConfirmed) {
                        const val = res.value;
                        axios
                          .post("/api/email/validity/test/", {
                            email: val,
                          })
                          .then(() => {
                            Swal.fire({
                              title: "Email Valid",
                              text: `Email is valid!`,
                              icon: "success",
                            });
                          })
                          .catch((eX) => {
                            Swal.fire({
                              title: "Email Invalid",
                              text: `Email is invalid!\n${
                                eX?.response?.data?.message || "Unknown Error"
                              }`,
                              icon: "error",
                            });
                          });
                      }
                    });
                  }}
                >
                  Test
                </FormButton>
              </div>
            </Card>
          </Grid>
          <Grid item md={4} xs={12}>
            <Card>
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                Trial Support
              </h1>
              <div className={"pt-4"}>
                <label htmlFor={"trialSupportMaxQueue"}>Max Queue Price</label>
                <input
                  type="text"
                  name="trialSupportMaxQueue"
                  id="trialSupportMaxQueue"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                  required={true}
                  defaultValue={props.trialSupportMaxQueue}
                />
                <label htmlFor={"trialSupportMaxDaily"}>Max Daily Credit</label>
                <input
                  type="text"
                  name="trialSupportMaxDaily"
                  id="trialSupportMaxDaily"
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                  required={true}
                  defaultValue={props.trialSupportMaxDaily}
                />
                <FormButton
                  onClickLoading={() => {
                    const trialSupportMaxQueue = (
                      document.getElementById(
                        "trialSupportMaxQueue"
                      ) as HTMLInputElement
                    ).value;
                    const trialSupportMaxDaily = (
                      document.getElementById(
                        "trialSupportMaxDaily"
                      ) as HTMLInputElement
                    ).value;
                    const promise1 = setSettingClient(
                      "trialSupportMaxQueue",
                      parseInt(trialSupportMaxQueue, 10)
                    );
                    const promise2 = setSettingClient(
                      "trialSupportMaxDaily",
                      parseInt(trialSupportMaxDaily, 10)
                    );
                    return Promise.all([promise1, promise2]);
                  }}
                  className={"mt-2"}
                >
                  Update Trial Support Settings
                </FormButton>
              </div>
            </Card>
          </Grid>
        </Grid>
      </RequireRole>
    </AdminNavProvider>
  );
};

export default Settings2Page;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { info, error } = context.query;
  return {
    props: {
      errAlert: error || "",
      infAlert: info || "",
      defaultCashAppIdLength: await getSetting("cashAppIdLength", 6),
      defaultCashAppIdWords: await getSetting("cashAppIdWords", false),
      defaultDefaultImage: await getSetting("defaultImage", ""),
      defaultEmailBackendApiUrl: await getSetting(
        "emailVerificationApiUrl",
        ""
      ),
      defaultCoinbaseApiKey: await getSetting("coinbaseApiKey", ""),
      defaultCoinbaseWebhookSecret: await getSetting(
        "coinbaseWebhookSecret",
        ""
      ),
      defaultCashAppEmailSecret: await getSetting("cashAppEmailSecret", ""),
      trialSupportMaxQueue: await getSetting("trialSupportMaxQueue", 50),
      trialSupportMaxDaily: await getSetting("trialSupportMaxDaily", 100),
      stockCheckerApiUrl: await getSetting("stockCheckerApiUrl", ""),
      maxErrorRetries: await getSetting("maxErrorRetries", 3),
      stockCheckerProxies: await getSetting("stockCheckerProxies", []),
    },
  };
}
