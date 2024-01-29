import React, { useEffect } from "react";

import { Grid, TextField } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Modal from "@components/admin/Modal";
import Alert from "@components/Alert";
import Field from "@components/Field";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { error as errorLog } from "@util/log";

const AddModal = (props: {
  emailRef: React.RefObject<HTMLInputElement>;
  reasonRef: React.RefObject<HTMLInputElement>;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  return (
    <Modal
      id={"add-modal"}
      title={"Flag Email"}
      description={"Enter email address to flag"}
      buttons={
        <>
          <FormButton
            type={"button"}
            color={"green"}
            fullWidth={false}
            className={"mx-4"}
            onClickLoading={() => {
              // POST /api/flagged/add {email, reason}
              return axios
                .post("/api/flagged/add/", {
                  email: props.emailRef.current?.value,
                  reason: props.reasonRef.current?.value,
                })
                .then((res) => {
                  window.location.href = `/admin/flagged/${res.data.id}?info=Successfully%20Added.`;
                })
                .catch((eX) => {
                  errorLog(eX);
                  props.setError(
                    eX?.response?.data?.message || "Something went wrong"
                  );
                })
                .finally(() => {
                  document.getElementById("add-modal")?.classList.add("hidden");
                });
            }}
          >
            Save
          </FormButton>
          <FormButton
            type={"button"}
            color={"red"}
            fullWidth={false}
            onClick={() => {
              document.getElementById("add-modal")?.classList.add("hidden");
            }}
          >
            Cancel
          </FormButton>
        </>
      }
    >
      {" "}
      <Field
        id={"enter-email-field"}
        name={"email"}
        required
        placeholder={"john.doe@example.com"}
        type={"email"}
        className={"pt-2"}
        refPassThrough={props.emailRef}
      />
      <Field
        id={"enter-reason-field"}
        name={"text"}
        required
        placeholder={"Reason"}
        type={"email"}
        className={"pt-2"}
        refPassThrough={props.reasonRef}
      />
    </Modal>
  );
};

const FlaggedEmailsHome = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const session = useSession();

  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "ID",
      width: 90,
      renderCell: (params: any) => {
        return (
          <a href={`/admin/flagged/${params.row._id as string}`}>
            {params.row._id as string}
          </a>
        );
      },
    },
    { field: "email", headerName: "Email", width: 150 },
    { field: "username", headerName: "Username", width: 150 },
    { field: "reason", headerName: "Reason", width: 150 },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      type: "dateTime",
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (data: any) => {
        return (
          <>
            <FormButton href={`/admin/flagged/${data.row._id as string}`}>
              View
            </FormButton>
          </>
        );
      },
    },
  ];

  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(15);
  const [data, setData] = React.useState<any[]>([]);

  const [error, setError] = React.useState<string>();
  const [info, setInfo] = React.useState<string>();
  const [canSearch, setCanSearch] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [maxSize, setMaxSize] = React.useState(1);

  const [searchUsername, setSearchUsername] = React.useState<string>("");
  const [searchEmail, setSearchEmail] = React.useState<string>("");

  const emailRef = React.useRef<HTMLInputElement>(null);
  const reasonRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.has("page")) setPage(parseInt(search.get("page") as string, 10));
    if (search.has("limit"))
      setLimit(parseInt(search.get("limit") as string, 10));
    setCanSearch(true);
  }, []);
  useEffect(() => {
    if (!canSearch) return;
    const newSearch = new URLSearchParams();
    if (page !== 0) newSearch.set("page", page.toString());
    if (limit !== 15) newSearch.set("limit", limit.toString());
    if (searchUsername !== "") newSearch.set("username", searchUsername);
    if (searchEmail !== "") newSearch.set("email", searchEmail);
    window.history.replaceState({}, "", `?${newSearch.toString()}`);
    setLoading(true);
    axios
      .get(`/api/flagged/get${window.location.search}`)
      .then((res) => {
        if (res.data.success) {
          setMaxSize(res.data.size);
          const d = res.data.result;
          d.forEach((e: any) => {
            e.createdAt = new Date(e.createdAt);
          });
          setData(d);
          setLoading(false);
        } else {
          setError(res.data.error);
        }
      })
      .catch((err) => {
        if (err?.response?.data?.message) {
          setError(err.response.data.message);
        } else setError("An unknown error occurred");
      });
  }, [page, limit, searchEmail, searchUsername]);

  return (
    <AdminNavProvider session={session}>
      <Meta title={`Flagged Emails`} description={"Flagged Emails"} />
      <AddModal emailRef={emailRef} reasonRef={reasonRef} setError={setError} />
      <h1 className={"text-2xl mt-2.5 font-bold"}>Flagged Emails</h1>
      {error && error !== "" && (
        <>
          <Alert
            type={"error"}
            dismissible={true}
            onDismiss={() => setError("")}
          >
            {error}
          </Alert>
        </>
      )}
      {info && info !== "" && (
        <>
          <Alert
            type={"success"}
            dismissible={true}
            onDismiss={() => setInfo("")}
          >
            {info}
          </Alert>
        </>
      )}
      <div id={"filters"} className={"py-4"}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              id={"username"}
              label={"Username"}
              className={"w-full"}
              onChange={(e) => {
                setSearchUsername(e.target.value);
              }}
              value={searchUsername}
            >
              Username
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id={"email"}
              label={"Email"}
              className={"w-full"}
              onChange={(e) => {
                setSearchEmail(e.target.value);
              }}
              value={searchEmail}
            >
              Email
            </TextField>
          </Grid>
        </Grid>
      </div>
      <div style={{ height: "75vh", width: "10%" }}>


        <FormButton
          onClick={() => {
            document.getElementById("add-modal")?.classList.remove("hidden");
          }}
          className={"mt-4"}
          fullWidth
        >
          Add
        </FormButton>
      </div>
    </AdminNavProvider>
  );
};

export default FlaggedEmailsHome;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {},
  };
}
