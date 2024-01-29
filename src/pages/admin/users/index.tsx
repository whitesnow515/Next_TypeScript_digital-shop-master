import React, { useEffect } from "react";

import { Grid, TextField } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";

const UsersPage = () => {
  const session = useSession();

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
  const columns: GridColDef[] = [
    {
      field: "_id",
      headerName: "ID",
      width: 90,
      sortable: false,
      renderCell: (params: any) => {
        return (
          <a href={`/admin/users/${params.row._id as string}`}>
            {params.row._id as string}
          </a>
        );
      },
    },
    { field: "username", headerName: "Username", width: 150, sortable: false },
    { field: "email", headerName: "Email", width: 150, sortable: false },
    { field: "roles", headerName: "Roles", width: 150, sortable: false },
    { field: "balance", headerName: "Balance", width: 150, sortable: false },
    {
      field: "emailVerified",
      headerName: "Email Verified",
      width: 150,
      sortable: false,
      renderCell: (data1: any) => {
        if (data1.row.emailVerified) return "Yes";
        return "No";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 180,
      renderCell: (data1: any) => {
        return (
          <>
            <FormButton href={`/admin/users/${data1.row._id as string}`}>
              View
            </FormButton>
            <FormButton
              className={"mx-2"}
              color={"red"}
              onClickLoading={() => {
                return Swal.fire({
                  title: "Are you sure?",
                  text: "This will delete the user and all their orders. This cannot be undone.",
                  icon: "warning",
                  showCancelButton: true,
                }).then((result) => {
                  if (result.isConfirmed) {
                    axios
                      .post(`/api/user/delete/${data1.row._id}`)
                      .then((res) => {
                        if (res.data.success) {
                          window.location.href = `/admin/users?info=Successfully%20Deleted%20User`;
                        } else {
                          setError(res.data.message);
                        }
                      })
                      .catch((err) => {
                        if (err.response) {
                          setError(err.response.data.message);
                        } else {
                          setError(err.message);
                        }
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
    if (search.has("username"))
      setSearchUsername(search.get("username") as string);
    if (search.has("email")) setSearchEmail(search.get("email") as string);
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
      .get(`/api/user/get${window.location.search}`)
      .then((res) => {
        if (res.data.success) {
          setMaxSize(res.data.size);
          setData(res.data.result);
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
      <Meta title={`Users`} description={"Admin users page"} />
      <h1 className={"text-2xl mt-2.5 font-bold"}>Users</h1>
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
              className={"w-full"}
              id={"username"}
              label={"Username"}
              autoComplete={"off"}
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
              className={"w-full"}
              id={"email"}
              label={"Email"}
              autoComplete={"off"}
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
      </div>
    </AdminNavProvider>
  );
};

export default UsersPage;
