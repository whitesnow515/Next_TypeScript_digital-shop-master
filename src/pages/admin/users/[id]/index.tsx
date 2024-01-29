import React, { useEffect, useState } from "react";

import {
  Chip,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Modal as MuiModal,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Modal from "@components/admin/Modal";
import OrdersGrid from "@components/admin/OrdersGrid";
import RoleList from "@components/admin/RoleList";
import Alert from "@components/Alert";
import RequireRole from "@components/auth/RequireRole";
import Avatar from "@components/avatar/Avatar";
import AvatarUploader from "@components/avatar/AvatarUploader";
import Card from "@components/Card";
import Field from "@components/Field";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import getFlaggedEmailModel from "@models/flaggedemails";
import getUserModel from "@models/user";
import { error as errorLog, log, debug } from "@util/log";
import { useRerenderHelper } from "@util/ReRenderHelper";
import { allRoles, getRole, Role, supportRolesExceptTrial } from "@util/Roles";

const getRolesRank = (roles: string[]) => {
  let highest = 0;
  let current = 0;
  for (let i = 0; i < roles.length; i += 1) {
    current = 0;
    /*
    switch (roles[i]) { // TODO pull from Roles
      case "trial_support":
        current = 1;
        break;
      case "support":
        current = 2;
        break;
      case "admin":
        current = 3;
        break;
      case "super_admin":
        current = 4;
        break;
      default:
        current = 0;
    }
     */
    current = getRole(roles[i] as string)?.priority || 0;
    if (current > highest) highest = current;
  }
  return highest;
};

const UserPage = ({
  success,
  message,
  user,
  infAlert,
  errAlert,
  flagged,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const rerender = useRerenderHelper();
  const session = useSession();
  const [info, setInfo] = useState<string | undefined>(infAlert as string);
  const [error, setError] = useState<string | undefined>(errAlert as string);

  const [sessionRank, setSessionRank] = useState(0);
  const [roleRank, setRoleRank] = useState(0);

  const [selectedRoles, setSelectedRoles] = useState<Role[]>();
  const [availableRoles, setAvailableRoles] = useState<Role[]>();
  const [rolesLoaded, setRolesLoaded] = useState<boolean>(false);
  const [rolesChanged, setRolesChanged] = useState<boolean>(false);

  const [note, setNote] = useState<string>((user?.note as string) || "");

  const [openBalHist, setOpenBalHist] = useState<boolean>(false);

  useEffect(() => {
    if (success) {
      const roles: Role[] = [];
      for (let i = 0; i < user.roles.length; i += 1) {
        const r = getRole(user.roles[i] as string);
        if (r) roles.push(r);
      }
      setSelectedRoles(roles);

      const available: Role[] = [];
      for (let i = 0; i < allRoles.length; i += 1) {
        const r = allRoles[i];
        if (r && !roles.includes(r)) available.push(r);
      }
      setAvailableRoles(available);
      setRolesLoaded(true);
    }
  }, [success, user]);

  const [bannedDate, setBannedDate] = useState<string>(); // thanks next hydration error

  useEffect(() => {
    if (message) {
      if (success) setInfo(message);
      else setError(message);
    }
  }, [message, success]);

  useEffect(() => {
    if (success) {
      if (user.banned)
        setBannedDate(new Date(user.banned.date).toLocaleString());
      setRoleRank(getRolesRank(user.roles));
    }
  }, [user, success]);

  useEffect(() => {
    if (session.status === "authenticated") {
      setSessionRank(getRolesRank((session.data! as any).roles));
    }
  }, [session]);

  const BalanceHistoryModal = ({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: (open: boolean) => void;
  }) => {
    const balanceColumns: GridColDef[] = [
      {
        field: "timestamp",
        headerName: "Date",
        width: 200,
        renderCell: (params) =>
          new Date(params.value as string).toLocaleString(),
      },
      {
        field: "performerDisplayName",
        headerName: "Performer",
        width: 150,
        renderCell: (params) => {
          if (params.row.performerId) {
            return (
              <a
                href={`/admin/users/${params.row.performerId}`}
                className={"text-white"}
              >
                {params.row.performerDisplayName}
              </a>
            );
          }
          return <span>{params.row.performerDisplayName}</span>;
        },
      },
      {
        field: "data.ip",
        headerName: "IP Address",
        width: 150,
        renderCell: (params) => params.row.ip,
      },
      {
        field: "order",
        headerName: "Order",
        width: 200,
        renderCell: (params) => {
          if (params.row.data.orderId) {
            return (
              <a
                href={`/admin/orders/${params.row.data.orderId}`}
                className={"text-white"}
              >
                {params.row.data.orderId}
              </a>
            );
          }
          return <span>{params.row.data.orderId || "No ID Provided."}</span>;
        },
      },
      {
        field: "data.before",
        headerName: "Before",
        width: 100,
        renderCell: (params) => (params.row.data.before as number).toFixed(2),
      },
      {
        field: "data.after",
        headerName: "After",
        width: 100,
        renderCell: (params) => (params.row.data.after as number).toFixed(2),
      },
      {
        field: "data.change",
        headerName: "Change",
        width: 100,
        renderCell: (params) => params.row.data.change,
      },
      {
        field: "data.amount",
        headerName: "Change Amount",
        width: 120,
        renderCell: (params) => params.row.data.amount,
      },
      {
        field: "data.reason",
        headerName: "Reason",
        width: 100,
        renderCell: (params) => params.row.data.reason,
      },
    ];
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [maxSize, setMaxSize] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      axios
        .get(`/api/admin/audit/balance/`, {
          params: {
            page,
            limit,
            userId: user._id,
          },
        })
        .then((res) => {
          debug(res);
          setData(res.data.data);
          setMaxSize(res.data.size);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [page, limit, open]);

    return (
      <>
        <MuiModal
          open={open}
          onClose={() => setOpen(!open)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <div
            style={{
              height: "75vh",
              width: "75%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
            }}
            className={"bg-gray-800"}
          >
            <DataGridPro
              rows={data}
              columns={balanceColumns}
              rowCount={maxSize}
              getRowId={(d) => {
                return d._id;
              }}
              loading={loading}
              slots={{
                loadingOverlay: LinearProgress,
              }}
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
            <FormButton className={"mt-4"} onClick={() => setOpen(!open)}>
              Close
            </FormButton>
          </div>
        </MuiModal>
      </>
    );
  };

  const banUser = (e: any) => {
    e.preventDefault();
    const reason = (document.getElementById("ban-reason") as HTMLInputElement)
      .value;
    axios
      .post("/api/user/update/ban/", {
        id: user._id,
        reason,
      })
      .then((res) => {
        if (res.data.success) {
          window.location.href = `/admin/users/${user._id}?info=Successfully%20Banned%20User`;
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
    const modal = document.getElementById("ban-confirmation-modal");
    modal?.classList.add("hidden");
  };

  const unbanUser = (e: any) => {
    e.preventDefault();
    axios
      .post("/api/user/update/unban/", {
        id: user._id,
      })
      .then((res) => {
        if (res.data.success) {
          window.location.href = `/admin/users/${user._id}?info=Successfully%20Unbanned%20User`;
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
    const modal = document.getElementById("unban-confirmation-modal");
    modal?.classList.add("hidden");
  };

  const handleDelete = (role: string) => {
    document.getElementById(role)?.classList.add("hidden");
    axios
      .post("/api/user/update/roles/remove/", {
        id: user._id,
        role,
      })
      .then((res) => {
        if (res.data.success) {
          window.location.href = `/admin/user/${user._id}?info=${res.data.message}`;
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => {
        if (err.response) {
          setError(err.response.data.message);
        } else {
          setError("An unknown error occurred.");
        }
      });
  };
  // @ts-ignore
  return (
    <>
      <Meta
        title={`Admin User`}
        description={`User page ${
          user?.username ? ` for ${user.username}` : ""
        }`}
      />
      <AdminNavProvider session={session}>
        {/* region modal */}
        <div className="hidden" id="ban-confirmation-modal">
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div
                className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-headline"
              >
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-100"
                        id="modal-headline"
                      >
                        Are you sure you want to ban this user?
                      </h3>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="reason"
                          id="ban-reason"
                          className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                          placeholder="Reason"
                        ></input>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141716] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={banUser}
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm duration-300"
                  >
                    Ban
                  </button>
                  <button
                    onClick={() => {
                      const modal = document.getElementById(
                        "ban-confirmation-modal"
                      );
                      modal?.classList.add("hidden");
                    }}
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-[#141716] text-base font-medium text-gray-100 hover:bg-[#303633] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden" id="unban-confirmation-modal">
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div
                className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-headline"
              >
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-100"
                        id="modal-headline"
                      >
                        Are you sure you want to unban this user?
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-300">
                          This will unban the user and allow them to use this
                          account and email once again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141716] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <FormButton
                    fullWidth={false}
                    onClick={unbanUser}
                    type="button"
                    color={"red"}
                    className={"ml-4"}
                  >
                    Unban
                  </FormButton>
                  <button
                    onClick={() => {
                      const modal = document.getElementById(
                        "unban-confirmation-modal"
                      );
                      modal?.classList.add("hidden");
                    }}
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-[#141716] text-base font-medium text-gray-100 hover:bg-[#303633] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal
          id={"flag-modal"}
          title={"Flag User"}
          description={"Please enter a reason"}
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
                      email: user.email,
                      reason: (
                        document.getElementById(
                          "flag-reason"
                        ) as HTMLInputElement
                      )?.value,
                    })
                    .then((res) => {
                      window.location.href = `/admin/flagged/${res.data.id}?info=Successfully%20Added.`;
                    })
                    .catch((eX) => {
                      errorLog(eX);
                      setError(
                        eX?.response?.data?.message || "Something went wrong"
                      );
                    })
                    .finally(() => {
                      document
                        .getElementById("flag-modal")
                        ?.classList.add("hidden");
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
                  document
                    .getElementById("flag-modal")
                    ?.classList.add("hidden");
                }}
              >
                Cancel
              </FormButton>
            </>
          }
        >
          <Field
            id={"flag-reason"}
            name={"text"}
            required
            placeholder={"Reason"}
            type={"email"}
            className={"pt-2"}
          />
        </Modal>
        {/* endregion */}
        {info && (
          <Alert type={"success"} dismissible onDismiss={() => setInfo("")}>
            {info}
          </Alert>
        )}
        {error && (
          <Alert type={"error"} dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {flagged && (
          <Alert
            type={"error"}
            button={
              <>
                <FormButton href={`/admin/flagged/${flagged}`}>
                  View Details
                </FormButton>
              </>
            }
          >
            This user{"'"}s email is flagged!
          </Alert>
        )}
        {success && user && (
          <>
            <Grid container className="flex-wrap xl:flex-nowrap" gap={2}>
              <Grid container gap={2} item xs={12} xl={4}>
                <Grid item xs={12}>
                  <Card>
                    <div className="flex flex-col items-center">
                      <Avatar
                        useMuiAvatar={true}
                        width={60}
                        height={60}
                        src={user.image || "/assets/images/profile.png"}
                      />
                      <h5 className="mb-1 text-2xl font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </h5>
                      <span className="text-md text-gray-500 dark:text-gray-400">
                        {user.email}
                      </span>
                      <div id={"chips"} className={"pt-4"}>
                        <Stack spacing={1} direction={"row"}>
                          {user.banned && (
                            <>
                              <Chip
                                label={"Banned"}
                                color={"error"}
                                onMouseEnter={() => {
                                  const popover =
                                    document.getElementById("ban-chip-popover");
                                  if (popover) {
                                    popover.classList.remove(
                                      "opacity-0",
                                      "invisible"
                                    );
                                    popover.classList.add(
                                      "opacity-100",
                                      "visible"
                                    );
                                  }
                                }}
                                onMouseLeave={() => {
                                  const popover =
                                    document.getElementById("ban-chip-popover");
                                  if (popover) {
                                    popover.classList.remove(
                                      "opacity-10",
                                      "visible"
                                    );
                                    popover.classList.add(
                                      "opacity-0",
                                      "invisible"
                                    );
                                  }
                                }}
                              />
                            </>
                          )}
                          {user.emailVerified && (
                            <Chip label={"Email Verified"} color={"success"} />
                          )}
                          {user.verified && (
                            <Chip label={"Verified"} color={"success"} />
                          )}
                          {user.roles.map((role: string) => {
                            if (role === "user") return null;
                            const roleObj = getRole(role);
                            if (!roleObj) return null;
                            return sessionRank > roleRank ? (
                              <Chip
                                id={role.toLowerCase()}
                                label={roleObj.displayName}
                                color={roleObj.isAdmin() ? "error" : "success"}
                                onDelete={() => handleDelete(role)}
                                key={role}
                              />
                            ) : (
                              <Chip
                                id={role.toLowerCase()}
                                label={roleObj.displayName}
                                color={roleObj.isAdmin() ? "error" : "success"}
                                key={role}
                              />
                            );
                          })}
                        </Stack>
                        <div className={""}>
                          <div
                            id={"ban-chip-popover"}
                            role="tooltip"
                            className="absolute z-10 invisible inline-block w-64 text-sm font-light transition-opacity duration-300 border rounded-lg shadow-sm opacity-0 text-gray-400 border-gray-600 bg-gray-800"
                          >
                            <div className="px-3 py-2 border-b rounded-t-lg border-[#404242] bg-[#141716]">
                              <h3 className="font-semibold text-white">
                                Banned
                              </h3>
                            </div>
                            {user.banned && (
                              <div className="px-3 py-2">
                                <Stack spacing={1}>
                                  <strong>
                                    Banned By:{" "}
                                    <span>{user.banned.bannedByName}</span>
                                  </strong>
                                  <strong>
                                    Date: <span>{bannedDate}</span>
                                  </strong>
                                  <strong>
                                    Reason: <span>{user.banned.reason}</span>
                                  </strong>
                                </Stack>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <RequireRole roles={supportRolesExceptTrial}>
                      <Grid container spacing={2} className={"my-2"}>
                        <Grid item xs={6}>
                          {user.banned ? (
                            <>
                              <FormButton
                                color={"red"}
                                modal={"unban-confirmation-modal"}
                              >
                                Unban User
                              </FormButton>
                            </>
                          ) : (
                            <>
                              <FormButton
                                color={"red"}
                                modal={"ban-confirmation-modal"}
                              >
                                Ban User
                              </FormButton>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={6}>
                          {flagged ? (
                            <>
                              <FormButton
                                color={"red"}
                                onClickLoading={() => {
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
                                            id: flagged,
                                          })
                                          .then(() => {
                                            window.location.href = `/admin/users/${user._id?.toString()}?info=Successfully unflagged user`;
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
                                Unflag User
                              </FormButton>
                            </>
                          ) : (
                            <>
                              <FormButton color={"red"} modal={"flag-modal"}>
                                Flag User
                              </FormButton>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={6} className={`justify-center`}>
                          <FormButton
                            onClickLoading={() => {
                              return axios
                                .post("/api/user/update/email/verify/", {
                                  id: user._id,
                                  verify: !user.emailVerified,
                                })
                                .then((res) => {
                                  if (res.data.success) {
                                    // window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Email%20Verification%20Status`;
                                    user.emailVerified = !user.emailVerified; // emailVerified is a date but whatever, this isnt replicated on server anyway
                                    setInfo(
                                      res.data.message ||
                                        "Successfully Updated Email Verification Status"
                                    );
                                    rerender();
                                  } else {
                                    setError(
                                      res.data?.message || "An error occurred."
                                    );
                                  }
                                })
                                .catch((eX) => {
                                  setError(
                                    eX?.response?.data?.message ||
                                      "An error occurred."
                                  );
                                });
                            }}
                          >
                            {user.emailVerified
                              ? "Unverify Email"
                              : "Verify Email"}
                          </FormButton>
                        </Grid>
                        <RequireRole admin>
                          <Grid item xs={6}>
                            <div>
                              <FormButton
                                disabled={flagged}
                                popover={"verify-popover"}
                                onClickLoading={() => {
                                  return axios
                                    .post("/api/user/update/verify/", {
                                      id: user._id,
                                      verify: !user.verified,
                                    })
                                    .then((res) => {
                                      if (res.data.success) {
                                        // window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Verification%20Status`;
                                        user.verified = !user.verified;
                                        setInfo(
                                          res.data?.message ||
                                            "Successfully updated verification status"
                                        );
                                        rerender();
                                      } else {
                                        setError(
                                          res.data?.message ||
                                            "An error occurred."
                                        );
                                      }
                                    })
                                    .catch((eX) => {
                                      setError(
                                        eX?.response?.data?.message ||
                                          "An error occurred."
                                      );
                                    });
                                }}
                              >
                                {user.verified
                                  ? "Unverify User"
                                  : "Verify User"}
                                {flagged ? " (Flagged)" : ""}
                              </FormButton>
                              <div
                                id={"verify-popover"}
                                role="tooltip"
                                className="absolute z-10 invisible inline-block w-64 text-sm font-light transition-opacity duration-300 border rounded-lg shadow-sm opacity-0 text-gray-400 border-gray-600 bg-gray-800"
                              >
                                <div className="px-3 py-2 border-b rounded-t-lg border-[#404242] bg-[#141716]">
                                  <h3 className="font-semibold text-white">
                                    Allows user to bypass verification queue
                                    {flagged
                                      ? "Option disabled due to user being flagged"
                                      : ""}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </Grid>
                          <Grid item xs={12}>
                            <div>
                              <FormButton
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
                                        .post(`/api/user/delete/${user._id}/`)
                                        .then((res) => {
                                          if (res.data.success) {
                                            window.location.href = `/admin/users/?info=Successfully%20Deleted%20User`;
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
                                Delete User
                              </FormButton>
                            </div>
                          </Grid>
                        </RequireRole>
                      </Grid>
                    </RequireRole>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <div>
                      <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
                        Notes
                      </h1>
                      <div className="flex flex-col items-center pt-3">
                        <TextField
                          id="note"
                          label="Note"
                          variant="outlined"
                          multiline
                          rows={4}
                          sx={{
                            width: "100%",
                          }}
                          value={note || ""}
                          onChange={(e) => {
                            setNote(e.target.value);
                          }}
                        />
                        <FormButton
                          className={"mt-4"}
                          onClick={() => {
                            axios
                              .post("/api/user/update/note/", {
                                id: user._id,
                                note,
                              })
                              .then((res) => {
                                if (res.data.success) {
                                  window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Note`;
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
                          }}
                        >
                          Save
                        </FormButton>
                      </div>
                    </div>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <div className="flex flex-col items-center mb-[20px]">
                      <p className="text-xl font-medium">Account Balance</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <label htmlFor={"balance"}>Balance</label>
                      <input
                        type={"number"}
                        className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                        placeholder={user.balance.toFixed(2)}
                        defaultValue={user.balance.toFixed(2)}
                        name={"balance"}
                        step={0.01}
                        id={"balance"}
                      />
                    </div>
                    <div className="flex flex-col items-center pt-2">
                      <label htmlFor={"orderId"}>OrderID</label>
                      <input
                        type={"text"}
                        className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                        placeholder={"Order ID Here"}
                        name={"orderId"}
                        id={"orderId"}
                      />
                    </div>
                    <FormButton
                      className={"mt-4"}
                      type={"submit"}
                      onClickLoading={() => {
                        // use swal to ask the user for a reason
                        const balance = parseFloat(
                          (
                            document.getElementById(
                              "balance"
                            ) as HTMLInputElement
                          ).value
                        );
                        const orderId = (
                          document.getElementById("orderId") as HTMLInputElement
                        ).value;
                        /*
                        if (!orderId) {
                          return Swal.fire({
                            title: "Please enter order ID",
                            icon: "error",
                          });
                        }
                         */
                        return Swal.fire({
                          title: "Please enter reason",
                          input: "text",
                          showCancelButton: true,
                          confirmButtonText: "Submit",
                          showLoaderOnConfirm: true,
                          preConfirm: (reason) => {
                            return axios
                              .post("/api/user/update/balance", {
                                id: user._id,
                                balance,
                                reason,
                                orderId,
                              })
                              .then((res) => {
                                if (res.data.success) {
                                  window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Balance`;
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
                          },
                        });
                      }}
                    >
                      Update Balance
                    </FormButton>
                    <BalanceHistoryModal
                      open={openBalHist}
                      setOpen={(open) => setOpenBalHist(open)}
                    />
                    <FormButton
                      className={"mt-4"}
                      type={"submit"}
                      toggle={[openBalHist, setOpenBalHist]}
                    >
                      View Balance History
                    </FormButton>
                  </Card>
                </Grid>
                <RequireRole admin>
                  <Grid item xs={12}>
                    <Card>
                      <div className="flex flex-col items-center">
                        {rolesLoaded && (
                          <>
                            <h1 className="text-2xl font-semibold mb-2">
                              Change Password
                            </h1>
                            <input
                              type="password"
                              name="new-password"
                              id="new-password"
                              autoComplete="new-password"
                              placeholder="••••••••••••••••"
                              className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                              onFocus={(e) => {
                                if (e.target.autocomplete) {
                                  e.target.autocomplete = "new-password";
                                }
                              }}
                            ></input>
                            <FormButton
                              type={"submit"}
                              style={"mt-4"}
                              onClickLoading={() => {
                                const password = (
                                  document.getElementById(
                                    "new-password"
                                  ) as HTMLInputElement
                                ).value;
                                return axios
                                  .post(
                                    `/api/user/update/password?user=${user._id}`,
                                    {
                                      newPassword: password,
                                    }
                                  )
                                  .then((res) => {
                                    if (res.data.success) {
                                      window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Password`;
                                    }
                                  })
                                  .catch((eX) => {
                                    if (eX?.response?.data?.message) {
                                      setError(eX.response.data.message);
                                    } else {
                                      setError(
                                        "An error occurred! Please try again later!"
                                      );
                                    }
                                  });
                              }}
                            >
                              Change Password
                            </FormButton>
                          </>
                        )}
                      </div>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <div className="flex flex-col justify-center items-center">
                        {rolesLoaded && (
                          <form
                            className="flex flex-col items-center"
                            onSubmit={(e) => {
                              e.preventDefault();
                              // @ts-ignore
                              const file = e.target.avatarUpload.files[0];
                              if (!file) {
                                setError("No file selected");
                                return;
                              }
                              const config = {
                                headers: {
                                  "content-type": "multipart/form-data",
                                },
                                onUploadProgress: (event: any) => {
                                  log(
                                    `Current progress:`,
                                    Math.round(
                                      (event.loaded * 100) / event.total
                                    )
                                  );
                                },
                              };
                              const formData = new FormData();
                              formData.append("files", file);
                              axios
                                .post(
                                  `/api/user/update/avatar?user=${user._id}`,
                                  formData,
                                  config
                                )
                                .then((res) => {
                                  log(res);
                                  if (res.data?.success) {
                                    window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Avatar`;
                                  } else {
                                    setError(res.data.message);
                                  }
                                });
                            }}
                          >
                            <h1 className="text-2xl font-semibold mb-2">
                              Change Profile Picture
                            </h1>
                            <AvatarUploader
                              defaultAvatar={
                                user.image || "/assets/images/profile.png"
                              }
                            />
                            <FormButton type={"submit"} style={"mt-4"}>
                              Change
                            </FormButton>
                          </form>
                        )}
                      </div>
                    </Card>
                  </Grid>
                </RequireRole>
              </Grid>
              <Grid container item gap={2} xs={12} md={8}>
                <Grid item xs={12} gap={2} className={"md:h-2/6"}>
                  <Card>
                    <div className="flex flex-col items-center">
                      <p className="text-xl font-medium">Orders</p>
                    </div>
                    <OrdersGrid
                      setError={setError}
                      height={500}
                      user={user._id}
                      embedded
                    />
                  </Card>
                  <RequireRole admin>
                    <Grid className="mt-3" item xs={12}>
                      <Card>
                        <div className="flex flex-col items-center">
                          {rolesLoaded && selectedRoles && availableRoles && (
                            <>
                              <RoleList
                                selectedRoles={selectedRoles}
                                availableRoles={availableRoles}
                                onListChange={(right, left) => {
                                  const rightRoles: (Role | undefined)[] =
                                    right.map((index) => {
                                      return getRole(index);
                                    });
                                  const leftRoles: (Role | undefined)[] =
                                    left.map((index) => {
                                      return getRole(index);
                                    });
                                  setSelectedRoles(rightRoles as Role[]);
                                  setAvailableRoles(leftRoles as Role[]);
                                  setRolesChanged(true);
                                }}
                              />
                              <FormButton
                                className={"mt-4"}
                                onClick={(e) => {
                                  axios
                                    .post("/api/user/update/roles/set", {
                                      id: user._id,
                                      roles: selectedRoles.map((role) => {
                                        return role.name;
                                      }),
                                    })
                                    .then((res) => {
                                      if (res.data.success) {
                                        window.location.href = `/admin/users/${user._id}?info=Successfully%20Updated%20Roles`;
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
                                }}
                                disabled={!rolesChanged}
                              >
                                Save
                              </FormButton>
                            </>
                          )}
                        </div>
                      </Card>
                    </Grid>
                  </RequireRole>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </AdminNavProvider>
    </>
  );
};

export default UserPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  if (!id) {
    return {
      notFound: true,
    };
  }
  if (id === "[object Object]") {
    log("Received invalid object for user id!", "admin/users/id");
    return {
      notFound: true,
    };
  }
  try {
    const idStr = id as string;
    const UserModel = await getUserModel();
    const user: any = await UserModel.findById(idStr);
    const { error, info } = context.query;
    if (!user) {
      return {
        props: {
          success: false,
          message: "User not found!",
          errAlert: error || "",
          infAlert: info || "",
        },
      };
    }
    const jsonUser = JSON.parse(JSON.stringify(user));
    delete jsonUser.password;
    const FlaggedModel = await getFlaggedEmailModel();
    let flagged = await FlaggedModel.findOne({
      email: user.email.toLowerCase(),
    }).exec();
    if (!flagged) {
      flagged = await FlaggedModel.findOne({
        user: user._id,
      }).exec();
    }
    return {
      props: {
        // session,
        id,
        user: jsonUser,
        success: true,
        message: "",
        errAlert: error || "",
        infAlert: info || "",
        flagged: flagged ? flagged._id.toString() : "",
      },
    };
  } catch (e) {
    return {
      props: {
        success: false,
        message: "An error occurred! Please try again later.",
      },
    };
  }
}
