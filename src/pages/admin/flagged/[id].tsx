import React, { useEffect, useState } from "react";

import { Grid, TextField } from "@mui/material";
import axios from "axios";
import { ObjectId } from "bson";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import OrdersGrid from "@components/admin/OrdersGrid";
import Alert from "@components/Alert";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import getFlaggedEmailModel from "@models/flaggedemails";
import { error as errorLog } from "@util/log";

const ViewFlaggedEmailPage = ({
  infoAlert,
  errorAlert,
  notFound,
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const [inf, setInfo] = useState<string>(infoAlert as string);
  const [err, setError] = useState<string>(errorAlert as string);

  const [date, setDate] = useState<string>("Loading...");

  const [reason, setReason] = useState<string>(data.reason ?? "");

  useEffect(() => {
    // load date client-side
    setDate(new Date(data.createdAt).toLocaleString());
  }, [data.createdAt]);

  return (
    <AdminNavProvider session={session}>
      <Meta title={"Flagged Email"} description={"Flagged Email"} />
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
      {notFound ? (
        <div className="text-xl">
          <p className="font-bold text-3xl">Flagged Email Not Found</p>
          <p className="text-xl">
            The flagged email you are looking for does not exist.
          </p>
        </div>
      ) : (
        <div className="text-xl">
          <p className="font-bold text-3xl">
            Flagged Email · <span className={"text-xl"}>{data.email}</span>
          </p>
          <Grid container className={"pt-4"} spacing={2}>
            <Grid item xs={12}>
              <Card>
                <Grid container spacing={2} className="mb-2">
                  {data.user && (
                    <>
                      <Grid item xs={6} sm={4}>
                        <p className="font-bold">Tied User</p>
                        <a
                          href={`/admin/users/${data.user}`}
                          className="text-white hover:text-primary-700"
                        >
                          {data.username}
                        </a>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={6} sm={4}>
                    <p className="font-bold">Flagged On</p>
                    <span className={"inline-block"}>{date}</span>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      id="reason"
                      label="Reason"
                      variant="outlined"
                      multiline
                      rows={4}
                      sx={{
                        width: "100%",
                      }}
                      value={reason || ""}
                      onChange={(e) => {
                        setReason(e.target.value);
                      }}
                    />
                    <FormButton
                      className={"mt-4"}
                      onClickLoading={(e) => {
                        e.preventDefault();
                        return axios
                          .post("/api/flagged/update/reason/", {
                            email: data.email,
                            reason,
                          })
                          .then((res) => {
                            setInfo(
                              res.data.message || "Successfully updated reason"
                            );
                          })
                          .catch((eX) => {
                            setError(eX.response.data.message);
                            setError(
                              eX.response.data.message || "An error occurred"
                            );
                          });
                      }}
                    >
                      Save
                    </FormButton>
                    <FormButton
                      className={"mt-4"}
                      color={"red"}
                      onClickLoading={(e) => {
                        e.preventDefault();
                        return new Promise<void>((resolve) => {
                          Swal.fire({
                            title: "Are you sure?",
                            text: "This will unflag the email",
                            icon: "warning",
                            showCancelButton: true,
                          }).then((result) => {
                            if (result.isConfirmed) {
                              axios
                                .post("/api/flagged/unflag/", {
                                  // email: data.email,
                                  id: data._id,
                                })
                                .then((res) => {
                                  window.location.href = "/admin/flagged";
                                })
                                .catch((eX) => {
                                  errorLog(eX);
                                  setError(
                                    eX.response.data.message ||
                                      "An error occurred"
                                  );
                                })
                                .finally(() => {
                                  resolve();
                                });
                            } else {
                              resolve();
                            }
                          });
                        });
                      }}
                    >
                      Unflag
                    </FormButton>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <div className="flex flex-col items-center mb-[20px]">
                  <p className="text-xl font-medium">
                    Orders (with this guest email)
                  </p>
                  {data.user && (
                    <span className="text-sm text-gray-500">
                      To see orders tied to the user, click{" "}
                      <a
                        href={`/admin/users/${data.user}`}
                        className="text-white hover:text-primary-700"
                      >
                        here
                      </a>
                    </span>
                  )}
                </div>
                <OrdersGrid
                  setError={setError}
                  height={500}
                  email={data.email}
                  embedded
                />
              </Card>
            </Grid>
          </Grid>
        </div>
      )}
    </AdminNavProvider>
  );
};

export default ViewFlaggedEmailPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { info, error } = context.query;
  const FlaggedModel = await getFlaggedEmailModel();
  const { id } = context.query;
  if (!id || !ObjectId.isValid(id as string)) {
    return {
      notFound: true,
    };
  }
  const flaggedEmail = await FlaggedModel.findById(id);
  if (!flaggedEmail) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      data: JSON.parse(JSON.stringify(flaggedEmail)),
      infoAlert: info || "",
      errorAlert: error || "",
      notFound: false,
    },
  };
}
