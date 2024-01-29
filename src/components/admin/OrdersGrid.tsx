//@ts-nocheck
import React, { useEffect } from "react";

import {
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { GridColDef, GridOverlay, GridOverlayProps } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import axios from "axios";
import moment, { Moment } from "moment";

import { OrderPropsInterface } from "@components/admin/Order";
import FormButton from "@components/FormButton";
import { getPrice } from "@util/EasterEgg";
import { debug } from "@util/log";
import { currency } from "@root/currency";

interface OrdersGridPropsInterface {
  setError: React.Dispatch<React.SetStateAction<any>>;
  grabFromParams?: boolean;
  height: any;
  user?: string;
  email?: string;
  embedded?: boolean;
  verificationQueue?: boolean;
  showVerificationQueueToggle?: boolean;
  showPaidOrdersSwitch?: boolean;
  mutateColumns?: (
    columns: GridColDef[],
    data: OrderPropsInterface[],
    refetch: () => Promise<void>
  ) => GridColDef[];
  renderActions?: (data: any, refetch: () => Promise<void>) => JSX.Element;
  showAdminControls?: boolean;
  defaultLimit?: number;
}

export const getAdminCols = (
  props_1: OrdersGridPropsInterface | null,
  query_1: () => Promise<void>
) => [
  {
    field: "__flagged__",
    headerName: "Flagged",
    type: "boolean",
    width: 100,
    sortable: false,
    renderCell: (params: any) => {
      return params.row?.metadata?.flagged ? (
        <>
          <FormButton
            href={`/admin/flagged/${params.row.metadata.flagged}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            color={"red"}
          >
            View
          </FormButton>
        </>
      ) : (
        "No"
      );
    },
  },
  {
    headerName: "Actions",
    // type: "actions",
    field: "_actions_",
    width: 300,
    sortable: false,
    renderCell: (params: any) => {
      if (props_1 && props_1.renderActions)
        return props_1.renderActions(params, query_1);
      return (
        <FormButton
          href={`/admin/orders/${params.row._id}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          View
        </FormButton>
      );
    },
  },
];
export const getUserCols = (
  props_1: OrdersGridPropsInterface | null,
  query_1: () => Promise<void>
) => [
  {
    headerName: "Actions",
    // type: "actions",
    field: "_actions_",
    width: 300,
    sortable: false,
    renderCell: (params: any) => {
      if (props_1 && props_1.renderActions)
        return props_1.renderActions(params, query_1);
      return (
        <FormButton
          href={`/orders/${params.row._id}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          View
        </FormButton>
      );
    },
  },
];

export const getDefCols = (admin = true) => [
  {
    field: "_id",
    headerName: "ID",
    width: 150,
    sortable: false,
    renderCell: (params: any) => {
      return (
        <a href={`${admin ? "/admin" : ""}/orders/${params.row._id as string}`}>
          {params.row._id as string}
        </a>
      );
    },
  },
  {
    field: "productName",
    headerName: "Product Name",
    width: 150,
    sortable: false,
    renderCell: (params: any) => {
      const item = params.row.subOrders[0];
      return item?.productName;
    },
  },
  {
    field: "originalPrice",
    headerName: "Total Price",
    width: 150,
    sortable: false,
    renderCell: (params: any) => {
      let tp = params.row.totalPrice;
      if (!tp || tp < 0) {
        try {
          const item = params.row.subOrders[0];
          tp = item.productPrice * item.productQuantity;
        } catch (e) {
          tp = 0;
        }
      }
      return getPrice(tp);
    },
  },
  {
    field: "productPrice",
    headerName: "Product Price",
    width: 150,
    sortable: false,
    renderCell: (params: any) => {
      const item = params.row.subOrders[0];
      return getPrice(item?.productPrice);
    },
  },
  {
    field: "productQuantity",
    headerName: "Quantity",
    width: 90,
    sortable: false,
    renderCell: (params: any) => {
      const item = params.row.subOrders[0];
      return item?.productQuantity;
    },
  },
  {
    field: "email",
    headerName: "Email",
    sortable: false,
    width: 175,
  },
  {
    field: "productOption",
    headerName: "Product Option",
    width: 150,
    sortable: false,
    renderCell: (params: any) => {
      const item = params.row.subOrders[0];
      return item?.productOption;
    },
  },
  {
    field: "timestamp",
    headerName: "Timestamp",
    width: 170,
    sortable: false,
    renderCell: (params: any) => {
      return new Date(params.row.timestamp).toLocaleString();
    },
  },
  {
    field: "paymentMethod",
    headerName: "Payment Method",
    sortable: false,
    width: 150,
  },
  {
    field: "totalPrice",
    headerName: "Total Price",
    sortable: false,
    width: 100,
  },
  {
    field: "status",
    headerName: "Status",
    sortable: false,
    width: 100,
  },
];

const OrdersGrid = ({
  showPaidOrdersSwitch = true,
  showAdminControls = true,
  defaultLimit = 15,
  ...props
}: OrdersGridPropsInterface) => {
  const [data, setData] = React.useState<OrderPropsInterface[]>([]);

  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(defaultLimit);
  const [before, setBefore] = React.useState<Date | undefined>();
  const [after, setAfter] = React.useState<Date | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [canSearch, setCanSearch] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [maxSize, setMaxSize] = React.useState(1);
  const [paidOnly, setPaidOnly] = React.useState(true);
  const [shortId, setShortId] = React.useState("");
  const [longId, setLongId] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [cashAppNote, setCashAppNote] = React.useState();
  const [status, setStatus] = React.useState("");

  const [sortby, setSortby] = React.useState();
  const [paymentMethod, setPaymentMethod] = React.useState("");

  const [username, setUserName] = React.useState("");
  const [email, setEmail] = React.useState(props.email ?? "");

  function query(): Promise<void> {
    debug("Querying");
    if (!canSearch) {
      return Promise.resolve();
    }
    const newSearch = new URLSearchParams();
    if (page !== 0) newSearch.set("orders_page", page.toString());
    if (limit !== 15) newSearch.set("orders_limit", limit.toString());
    if (before) newSearch.set("before", before.toISOString());
    if (after) newSearch.set("after", after.toISOString());
    if (!paidOnly) newSearch.set("paid", "false");
    if (shortId && shortId !== "") newSearch.set("shortId", shortId);
    if (longId && longId !== "") newSearch.set("longId", longId);
    if (search && search !== "") newSearch.set("search", search);
    if (status && status !== "") newSearch.set("status", status);
    if (paymentMethod && paymentMethod !== "")
      newSearch.set("paymentMethod", paymentMethod);
    else newSearch.delete("paymentMethod");
    if (productName) newSearch.set("productName", productName);
    if (search && search !== "") newSearch.set("search", search);
    if (username && username !== "") newSearch.set("username", username);

    let str = newSearch.toString();
    if (email && email !== "") {
      newSearch.set("email", email);
      // check if it isn't the same as props
      if (props.email !== email) {
        str = newSearch.toString(); // this is gonna have issues with the user check above but whatever
      }
    }
    // if (verificationQueue && !props.verificationQueue) {
    //  newSearch.set("verificationQueue", "true");
    // }
    if (str.length > 0) window.history.replaceState({}, "", `?${str}`);
    else if (window.location.search.startsWith("?")) {
      window.history.replaceState({}, "", window.location.pathname);
    } else window.history.replaceState({}, "", window.location.pathname);
    if (props.user) {
      newSearch.set("user", props.user);
    }
    if (props.verificationQueue) {
      newSearch.set("verificationQueue", "true");
    }
    if (cashAppNote) {
      newSearch.set("cashappNote", cashAppNote);
    }
    if (search) {
      newSearch.set("search", search);
    }

    if (sortby) {
      newSearch.set("sort", sortby);
    }
    setLoading(true);
    debug(newSearch.toString());
    const url = `/api/orders/get?${newSearch}`
      .replace("orders_page", "page")
      .replace("orders_limit", "limit");
    return axios
      .get(url)
      .then((res) => {
        if (res.data.success) {
          debug(res);
          setMaxSize(res.data.size);
          setData(res.data.result);
          setLoading(false);
        } else {
          props.setError(res.data.error);
        }
      })
      .catch((err) => {
        if (err?.response?.data?.message) {
          props.setError(err.response.data.message);
        } else props.setError("An unknown error occurred");
      });
  }

  const columns: GridColDef[] = [
    ...getDefCols(),
    ...(showAdminControls
      ? getAdminCols(props, query)
      : getUserCols(props, query)),
  ];
  const [cols, setCols] = React.useState<GridColDef[]>(columns);
  // const [verificationQueue, setVerificationQueue] = React.useState(
  //  props.verificationQueue ?? false
  // );

  useEffect(() => {
    if (props.mutateColumns) {
      setCols(props.mutateColumns(columns, data, () => query()));
    }
  }, [props.mutateColumns]);
  useEffect(() => {
    if (props.grabFromParams) {
      const search = new URLSearchParams(window.location.search);
      if (search.has("orders_page"))
        setPage(parseInt(search.get("orders_page") as string, 10));
      if (search.has("orders_limit"))
        setLimit(parseInt(search.get("orders_limit") as string, 10));
      if (search.has("before"))
        setBefore(new Date(search.get("before") as string));
      if (search.has("after"))
        setAfter(new Date(search.get("after") as string));
      if (search.has("paid")) setPaidOnly(search.get("paid") === "true");
      if (search.has("shortId")) setShortId(search.get("shortId") as string);
      if (search.has("search")) setSearch(search.get("uniqid") as string);
      if (search.has("paymentMethod"))
        setPaymentMethod(search.get("paymentMethod") as string);
      if (search.has("search"))
        setSearch(search.get("cryptoAddress") as string);
      if (search.has("status")) setStatus(search.get("status") as string);
      if (search.has("email")) setEmail(search.get("email") as string);
      if (search.has("username")) setUserName(search.get("username") as string);
      if (search.has("paymentMethod"))
        setSearch(search.get("paymentMethod") as string);
      query();
    }
    setCanSearch(true);
  }, [props.grabFromParams]);
  useEffect(() => {
    if (!canSearch) return;
    debug("Update");
    query().then(); // don't care about the result
  }, [
    page,
    limit,
    before,
    after,
    canSearch,
    paidOnly,
    shortId,
    paymentMethod,
    props.user,
    props.email,
    email,
    username,
    sortby,
    search,
    status,
  ]);
  const GridNoResultsOverlay = React.forwardRef<
    HTMLDivElement,
    GridOverlayProps
    // eslint-disable-next-line @typescript-eslint/no-shadow
  >(function GridNoResultsOverlay(props: any, ref) {
    return (
      // eslint-disable-next-line react/jsx-no-undef
      <GridOverlay ref={ref} {...props}>
        <div className="flex flex-col items-center">
          <p>No Orders Found</p>
          <FormButton
            className={"m-4"}
            fullWidth={false}
            onClickLoading={() => {
              return query();
            }}
          >
            Search Again
          </FormButton>
        </div>
      </GridOverlay>
    );
  });

  return (
    <>
      <div>
        <Grid container className="mb-2">
          {showPaidOrdersSwitch && (
            <Grid item md={4} xs={6}>
              <FormControlLabel
                className={"w-full"}
                control={
                  <Switch
                    checked={paidOnly}
                    onChange={(e) => setPaidOnly(e.target.checked)}
                  />
                }
                label={
                  paidOnly ? "Showing paid orders" : "Showing unpaid orders"
                }
              />
            </Grid>
          )}
          {/* props.showVerificationQueueToggle && (
            <Grid item md={4} xs={6}>
              <FormControlLabel
                className={"w-full"}
                control={
                  <Switch
                    checked={verificationQueue}
                    onChange={(e) => setVerificationQueue(e.target.checked)}
                  />
                }
                label={
                  verificationQueue
                    ? "Showing verification queue"
                    : "Not showing verification queue"
                }
              />
            </Grid>
          ) */}
        </Grid>
        <Grid container>
          <Grid item spacing={2} direction={"row"} container xs={12}>
            {/* <Grid item md={2}>
              <TextField
                label={"Long ID"}
                value={longId}
                autoComplete={"off"}
                onFocus={(event) => {
                  if (event.target.autocomplete) {
                    event.target.autocomplete = "stupid-chrome";
                  }
                }}
                sx={{
                  width: "100%",
                }}
                onChange={(e) => setLongId(e.target.value)}
              />
            </Grid> */}
            <Grid item md={2}>
              <TextField
                label={"Product Name"}
                value={productName}
                autoComplete={"off"}
                onFocus={(event) => {
                  if (event.target.autocomplete) {
                    event.target.autocomplete = "stupid-chrome";
                  }
                }}
                sx={{
                  width: "100%",
                }}
                onChange={(e) => setProductName(e.target.value)}
              />
            </Grid>
            {/* <Grid item md={2}>
              <TextField
                label={"Crypto Address"}
                value={cryptoAddress}
                autoComplete={"off"}
                onFocus={(event) => {
                  if (event.target.autocomplete) {
                    event.target.autocomplete = "stupid-chrome";
                  }
                }}
                sx={{
                  width: "100%",
                }}
                onChange={(e) => setCryptoAddress(e.target.value)}
              />
            </Grid>
            <Grid item md={2}>
              <TextField
                label={"CashApp Note"}
                value={cashAppNote}
                autoComplete={"off"}
                onFocus={(event) => {
                  if (event.target.autocomplete) {
                    event.target.autocomplete = "stupid-chrome";
                  }
                }}
                sx={{
                  width: "100%",
                }}
                onChange={(e) => setCashAppNote(e.target.value)}
              />
            </Grid>
            <Grid item md={2}>
              <TextField
                label={"Payment ID"}
                autoComplete={"off"}
                value={shortId}
                sx={{
                  width: "100%",
                }}
                onChange={(e) => setShortId(e.target.value)}
              />
            </Grid> */}
            {!props.embedded && (
              <>
                <Grid item md={3}>
                  <TextField
                    label={"Email"}
                    value={email}
                    autoComplete={"off"}
                    sx={{
                      width: "100%",
                    }}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                  >
                    Email
                  </TextField>
                </Grid>
                <Grid item md={3}>
                  <TextField
                    label={"Username"}
                    value={username}
                    autoComplete={"off"}
                    onChange={(e) => {
                      setUserName(e.target.value);
                    }}
                    sx={{
                      width: "100%",
                    }}
                  >
                    User
                  </TextField>
                </Grid>
              </>
            )}
            <Grid item md={4}>
              <TextField
                id={"payment-method"}
                label={"Payment Method"}
                value={paymentMethod}
                className={"w-full"}
                onChange={(e) => setPaymentMethod(e.target.value as string)}
                select // https://stackoverflow.com/a/67068903
              >
                <MenuItem value={""}>All</MenuItem>
                <MenuItem value={"Balance"}>Balance</MenuItem>
                {currency.map((currency) => (
                  <MenuItem value={currency.value}>{currency.coin}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item md={4}>
              <DateRangePicker
                localeText={{ start: "After", end: "Before" }}
                value={[
                  after ? moment(after) : null,
                  before ? moment(before) : null,
                ]}
                onChange={(e) => {
                  const moment2 = e[0] as Moment;
                  const moment1 = e[1] as Moment;
                  if (moment1) setBefore(moment1.toDate());
                  else setBefore(undefined);
                  if (moment2) setAfter(moment2.toDate());
                  else setAfter(undefined);
                }}
              />
            </Grid>
            <Grid item md={2}>
              <TextField
                id={"sortby"}
                label={"Sort by"}
                value={sortby}
                className={"w-full"}
                onChange={(e) => setSortby(e.target.value as string)}
                select // https://stackoverflow.com/a/67068903
              >
                <MenuItem value={"price"}>Price</MenuItem>
                <MenuItem value={"name"}>Name</MenuItem>
                <MenuItem value={"date"}>Date</MenuItem>
              </TextField>
            </Grid>
            {!props.embedded && (
              <>
                <Grid item md={2}>
                  <FormButton
                    fullHeight
                    fullWidth
                    onClickLoading={() => {
                      return query();
                    }}
                  >
                    Search
                  </FormButton>
                </Grid>
                <Grid item md={2}>
                  <FormButton
                    fullHeight
                    fullWidth
                    color={"red"}
                    onClick={() => {
                      // clear the query params
                      window.history.replaceState(
                        {},
                        "",
                        window.location.pathname
                      );
                      // refresh
                      window.location.reload();
                    }}
                  >
                    Clear
                  </FormButton>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </div>
      <div className="flex justify-between items-end mt-3">
        <div className="w-[30%]">
          <TextField
            id={"payment-method"}
            label={"Status"}
            value={status}
            className={"w-full"}
            onChange={(e) => setStatus(e.target.value as string)}
            select // https://stackoverflow.com/a/67068903
          >
            <MenuItem value={""}>All</MenuItem>
            <MenuItem value={"completed"}>Complete</MenuItem>
            <MenuItem value={"pending"}>Pending</MenuItem>
            <MenuItem value={"awaiting-verification"}>
              Awaiting Verification
            </MenuItem>
          </TextField>
        </div>
        <div className="md:w-[50%] w-[50%]">
          <div className=" px-2 py-2 border border-[#6A6B74] flex items-center gap-1 rounded-full hover:border-[#9799A6] bg-white">
            <img className="w-5 h-5" src="/assets/images/search-icon.svg" />
            <input
              type="text"
              autoComplete="off"
              aria-autocomplete="none"
              name="search"
              id="search"
              value={search}
              className="outline-none hover-circle sm:text-sm bg-transparent block w-full placeholder-black text-black focus:border-[#FFFFFF] duration-150"
              placeholder={"Search by order id, address, transaction id....."}
              onChange={(e) => {
                setSearch(e.target.value);
                // setCurrentPage(1);
              }}
            ></input>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", height: props.height }} className={"pt-4"}>
        <DataGridPro
          rows={data}
          columns={cols}
          rowCount={maxSize}
          getRowId={(d) => {
            return d._id;
          }}
          loading={loading}
          pageSizeOptions={[5, 10, 15, 20, 25, 30, 50, 100]}
          disableRowSelectionOnClick
          paginationMode={"server"}
          paginationModel={{
            page,
            pageSize: limit,
          }}
          pagination
          onPaginationModelChange={(change) => {
            setLimit(change.pageSize);
            setPage(change.page);
          }}
          className={"pt-4"}
          disableColumnFilter
          slots={{
            noRowsOverlay: GridNoResultsOverlay,
            noResultsOverlay: GridNoResultsOverlay,
          }}
        />
      </div>
    </>
  );
};

export default OrdersGrid;
