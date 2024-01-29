import React, { useEffect } from "react";

import { TextField } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

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
      title={"Allow Email"}
      description={"Enter email address to allow"}
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
                .post("/api/email/validity/exempt/add/", {
                  email: props.emailRef.current?.value,
                })
                .then((res) => {
                  window.location.reload();
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
    </Modal>
  );
};
const AllowedEmailsPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const session = useSession();

  const emailRef = React.useRef<HTMLInputElement>(null);
  const reasonRef = React.useRef<HTMLInputElement>(null);

  const [error, setError] = React.useState<string>();
  const [info, setInfo] = React.useState<string>();

  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(15);
  const [data, setData] = React.useState<any[]>([]);
  const [maxSize, setMaxSize] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [canSearch, setCanSearch] = React.useState(false);

  const [searchEmail, setSearchEmail] = React.useState<string>("");

  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "ID",
      width: 90,
    },
    {
      field: "email",
      headerName: "Email",
      width: 180,
    },
    {
      field: "addedByName",
      headerName: "Added By",
      width: 150,
      renderCell: (params: any) => {
        return (
          <a href={`/admin/users/${params.row.addedBy as string}`}>
            {params.row.addedByName as string}
          </a>
        );
      },
    },
    {
      field: "addedAt",
      headerName: "Added At",
      width: 170,
      renderCell: (params: any) => {
        return <span>{new Date(params.row.addedAt).toLocaleString()}</span>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (_: any) => {
        return (
          <>
            <FormButton
              color={"red"}
              onClick={() => {
                Swal.fire({
                  title: "Are you sure?",
                  text: "This cannot be undone",
                  icon: "warning",
                  showCancelButton: true,
                }).then((res) => {
                  if (res.isConfirmed) {
                    axios
                      .post("/api/email/validity/exempt/delete/", {
                        id: _.row._id,
                      })
                      .then(() => {
                        window.location.reload();
                      })
                      .catch((err) => {
                        Swal.fire({
                          title: "Error",
                          text:
                            err?.response?.data?.message ||
                            "Something went wrong",
                          icon: "error",
                        });
                      });
                  }
                });
              }}
            >
              Delete
            </FormButton>
          </>
        );
      },
    },
  ];

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
    if (searchEmail) newSearch.set("email", searchEmail);
    window.history.replaceState({}, "", `?${newSearch.toString()}`);
    setLoading(true);
    axios
      .get(`/api/email/validity/exempt/get${window.location.search}`)
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
  }, [page, limit, searchEmail]);

  return (
    <AdminNavProvider session={session}>
      <Meta title={`Allowed Emails`} description={"Allowed Emails"} />
      <AddModal emailRef={emailRef} reasonRef={reasonRef} setError={setError} />
      <h1 className={"text-2xl mt-2.5 font-bold"}>Allowed Emails</h1>
      <span className={"text-gray-500"}>
        Emails exempt from the validity checker
      </span>
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
      </div>
      <div style={{ height: "75vh", width: "100%" }}>
        <DataGridPro
          rows={data}
          columns={columns}
          rowCount={maxSize}
          getRowId={(d) => {
            return d._id;
          }}
          loading={loading}
          pageSizeOptions={[5, 10, 15, 20, 25, 30, 50, 100]}
          disableRowSelectionOnClick
          paginationMode={"server"}
          pagination
          paginationModel={{
            page,
            pageSize: limit,
          }}
          onPaginationModelChange={(change) => {
            setLimit(change.pageSize);
            setPage(change.page);
          }}
          disableColumnFilter
        />
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

export default AllowedEmailsPage;
export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {},
  };
}
