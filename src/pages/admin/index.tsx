import React, { useEffect } from "react";

import { Grid } from "@mui/material";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import axios from "axios";
import moment, { Moment } from "moment/moment";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import AdminNavProvider from "@components/admin/AdminNavProvider";
import RequireRole from "@components/auth/RequireRole";
import Card from "@components/Card";
import Chart from "@components/Chart";
import FormButton from "@components/FormButton";
import { GenericMetric } from "@src/types/metrics";
import {
  cashAppCreatedMetricName,
  cashAppPaidMetricName,
  coinbaseCreatedMetricName,
  coinbasePaidMetricName,
  ordersCreatedMetricName,
  ordersPaidMetricName,
  SalesMetric,
} from "@src/types/metrics/SalesMetrics";
import { signinMetricName } from "@src/types/metrics/SigninMetrics";
import { signupMetricName } from "@src/types/metrics/SignupMetrics";
import { debug } from "@util/log";
import { adminRoles, sessionHasRoles, supportRoles } from "@util/Roles";
import PieChart from "@components/PieChart";
import getOrderModel from "@models/order";
import { requireLoggedInSSP } from "@util/AuthUtils";

const AdminPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const session: any = useSession();
  // this should be put in a component but i cba
  const [daysCategory, setDaysCategory] = React.useState<string[]>([]);
  const [salesData, setSalesData] = React.useState<number[]>([]);
  const [revenueData, setRevenueData] = React.useState<number[]>([]);

  const [signInData, setSignInData] = React.useState<number[]>([]);
  const [signupsData, setSignupsData] = React.useState<number[]>([]);
  const [daysCategorySignIn, setDaysCategorySignIn] = React.useState<string[]>(
    []
  );
  const [ordersCreatedData, setOrdersCreatedData] = React.useState<number[]>(
    []
  );
  const [ordersPaidData, setOrdersPaidData] = React.useState<number[]>([]);

  const [cashAppCreatedData, setCashAppCreatedData] = React.useState<number[]>(
    []
  );
  const [cashAppPaidData, setCashAppPaidData] = React.useState<number[]>([]);
  const [coinbaseCreatedData, setCoinbaseCreatedData] = React.useState<
    number[]
  >([]);
  const [coinbasePaidData, setCoinbasePaidData] = React.useState<number[]>([]);
  const [daysCategoryProviderCreated, setDaysCategoryProviderCreated] =
    React.useState<string[]>([]);
  const [daysCategoryProviderPaid, setDaysCategoryProviderPaid] =
    React.useState<string[]>([]);
  const [cashAppRevenueData, setCashAppRevenueData] = React.useState<number[]>(
    []
  );
  const [coinbaseRevenueData, setCoinbaseRevenueData] = React.useState<
    number[]
  >([]);

  const [daysCategoryOrders, setDaysCategoryOrders] = React.useState<string[]>(
    []
  );

  const [before, setBefore] = React.useState<Date | undefined>();
  const [after, setAfter] = React.useState<Date | undefined>();
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const [canQuery, setCanQuery] = React.useState<boolean>(false);
  useEffect(() => {
    if (!canQuery || session.status !== "authenticated") {
      return;
    }
    const admin = sessionHasRoles(session, adminRoles, false);
    debug("Querying");
    // shit code
    const newSearch = new URLSearchParams();
    if (before && !isNaN(before.getTime())) {
      newSearch.set("to", before.toISOString());
    }
    if (after && !isNaN(after.getTime())) {
      newSearch.set("from", after.toISOString());
    }
    const str = newSearch.toString();
    if (str.length > 0) window.history.replaceState({}, "", `?${str}`);
    axios
      .get(`/api/admin/metrics/sales/${window.location.search}`)
      .then((res) => {
        debug(res);
        const sD = res.data.data as SalesMetric[];
        debug({ sD });
        setSalesData(
          sD.map((item) => {
            return item.ordersPaid.count || 0;
          })
        );
        setRevenueData(sD.map((item) => item.ordersPaid.revenue));
        setDaysCategory(sD.map((item) => item._id));
        setCashAppRevenueData(
          sD.map((item) => Math.round(item.cashAppPaid.revenue * 100) / 100)
        );
        setCoinbaseRevenueData(
          sD.map((item) => Math.round(item.coinbasePaid.revenue * 100) / 100)
        );
      })
      .catch(() => {});
    const metricNames = [signinMetricName, signupMetricName];
    if (admin) {
      metricNames.push(
        ordersPaidMetricName,
        ordersCreatedMetricName,
        cashAppCreatedMetricName,
        cashAppPaidMetricName,
        coinbaseCreatedMetricName,
        coinbasePaidMetricName
      );
    }
    const url = `/api/admin/metrics/${metricNames.join(",")}/${
      window.location.search
    }`;
    debug(url);
    axios
      .get(url)
      .then((res) => {
        // God i want to rip my eyes out
        debug(res);
        const { data } = res;
        const signInStuff: GenericMetric[] = data?.data
          ?.signin as GenericMetric[];
        setSignInData(signInStuff.map((item) => item.count));
        setDaysCategorySignIn(signInStuff.map((item) => item._id));
        const signupStuff: GenericMetric[] = data?.data
          ?.signup as GenericMetric[];
        setSignupsData(signupStuff.map((item) => item.count));
        if (admin) {
          const ordersCreatedStuff: GenericMetric[] = data?.data
            ?.ordersCreated as GenericMetric[];
          debug({ ordersCreatedStuff: data?.data?.ordersCreated });
          setOrdersCreatedData(ordersCreatedStuff.map((item) => item.count));
          setDaysCategoryOrders(ordersCreatedStuff.map((item) => item._id));
          const ordersPaidStuff: GenericMetric[] = data?.data
            ?.ordersPaid as GenericMetric[];
          setOrdersPaidData(ordersPaidStuff.map((item) => item.count));

          // coinbase stuff
          const coinbaseCreatedRes: GenericMetric[] = data?.data
            ?.coinbaseCreated as GenericMetric[];
          setCoinbaseCreatedData(coinbaseCreatedRes.map((item) => item.count));
          setDaysCategoryProviderCreated(
            coinbaseCreatedRes.map((item) => item._id)
          );
          const coinbasePaidRes: GenericMetric[] = data?.data
            ?.coinbasePaid as GenericMetric[];
          setCoinbasePaidData(coinbasePaidRes.map((item) => item.count));
          setDaysCategoryProviderPaid(coinbasePaidRes.map((item) => item._id));
          // cashapp stuff
          const cashAppCreatedRes: GenericMetric[] = data?.data
            ?.cashAppCreated as GenericMetric[];
          setCashAppCreatedData(cashAppCreatedRes.map((item) => item.count));
          setDaysCategoryProviderCreated(
            cashAppCreatedRes.map((item) => item._id)
          );
          const cashAppPaidRes: GenericMetric[] = data?.data
            ?.cashAppPaid as GenericMetric[];
          setCashAppPaidData(cashAppPaidRes.map((item) => item.count));
        }
      })
      .catch(() => {});
  }, [before, after, refresh, canQuery, session]);
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.has("to")) setBefore(new Date(search.get("to") as string));
    if (search.has("from")) setAfter(new Date(search.get("from") as string));
    setCanQuery(true);
  }, []);
  useEffect(() => {
    debug({ ordersCreatedData });
  }, [ordersCreatedData]);

  const events = {
    // handle zoom out button
    beforeZoom(chartContext: any, { xaxis }: any) {
      const { min, max } = xaxis;
      debug({ xaxis });
      setBefore(new Date(max));
      setAfter(new Date(min));
    },
  };

  return (
    <AdminNavProvider session={session}>
      <h1 className={"text-2xl mt-2.5 font-bold"}>
        Welcome back, {props.username || session.data?.name}
      </h1>
      <h5 className={"text-sm font-bold text-gray-600"}>
        Here{"'"}s what{"'"}s happening at a glance
      </h5>
      <RequireRole admin>
        <div
          id={"filters"}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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
          <div>
            <FormButton
              className={"m-4"}
              disabled={!before && !after}
              fullWidth={false}
              onClick={() => {
                window.location.href = "/admin"; // idk why setting before and after states to undef doesn't work
              }}
            >
              Clear
            </FormButton>
          </div>
        </div>
        <div id={"cards"} className={"p-4"}>
          <Grid container spacing={2} className="mb-[15px]">
            <RequireRole admin roles={supportRoles}>
              <Grid item xs={12} md={6}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Recent Sales & Revenue
                    </h1>
                    <Chart
                      options={{
                        chart: {
                          height: 350,
                          type: "area",
                          id: "recent-sales-revenue",
                          events,
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        stroke: {
                          curve: "smooth",
                        },
                        xaxis: {
                          type: "datetime",
                          categories: daysCategory,
                        },
                        tooltip: {
                          x: {
                            format: "dd/MM/yy",
                          },
                        },
                      }}
                      series={[
                        {
                          name: "Sales",
                          data: salesData,
                        },
                        {
                          name: "Revenue",
                          data: revenueData,
                        },
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Revenue by payment provider
                    </h1>
                    <Chart
                      options={{
                        chart: {
                          height: 350,
                          type: "area",
                          id: "recent-sales-revenue-provider",
                          events,
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        stroke: {
                          curve: "smooth",
                        },
                        xaxis: {
                          type: "datetime",
                          categories: daysCategory,
                        },
                        tooltip: {
                          x: {
                            format: "dd/MM/yy",
                          },
                        },
                      }}
                      series={[
                        {
                          name: "CashApp",
                          data: cashAppRevenueData,
                          color: "#00E396",
                        },
                        {
                          name: "Coinbase",
                          data: coinbaseRevenueData,
                          color: "#008FFB",
                        },
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      Orders Created & Orders Paid
                    </h1>
                    <Chart
                      options={{
                        chart: {
                          height: 350,
                          type: "area",
                          id: "orders-created-paid",
                          events,
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        stroke: {
                          curve: "smooth",
                        },
                        xaxis: {
                          type: "datetime",
                          categories: daysCategoryOrders,
                        },
                        tooltip: {
                          x: {
                            format: "dd/MM/yy",
                          },
                        },
                      }}
                      series={[
                        {
                          name: "Orders Created",
                          data: ordersCreatedData,
                        },
                        {
                          name: "Orders Paid",
                          data: ordersPaidData,
                        },
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      CashApp & Coinbase Orders Created
                    </h1>
                    <Chart
                      options={{
                        chart: {
                          height: 350,
                          type: "area",
                          id: "cashapp-coinbase-orders-created",
                          events,
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        stroke: {
                          curve: "smooth",
                        },
                        xaxis: {
                          type: "datetime",
                          categories: daysCategoryProviderCreated,
                        },
                        tooltip: {
                          x: {
                            format: "dd/MM/yy",
                          },
                        },
                      }}
                      series={[
                        {
                          name: "CashApp",
                          data: cashAppCreatedData,
                          color: "#00E396",
                        },
                        {
                          name: "Coinbase",
                          data: coinbaseCreatedData,
                          color: "#008FFB",
                        },
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <div>
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                      CashApp & Coinbase Orders Paid
                    </h1>
                    <Chart
                      options={{
                        chart: {
                          height: 350,
                          type: "area",
                          id: "cashapp-coinbase-orders-paid",
                          events,
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        stroke: {
                          curve: "smooth",
                        },
                        xaxis: {
                          type: "datetime",
                          categories: daysCategoryProviderPaid,
                        },
                        tooltip: {
                          x: {
                            format: "dd/MM/yy",
                          },
                        },
                      }}
                      series={[
                        {
                          name: "CashApp",
                          data: cashAppPaidData,
                          color: "#00E396",
                        },
                        {
                          name: "Coinbase",
                          data: coinbasePaidData,
                          color: "#008FFB",
                        },
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </Card>
              </Grid>
            </RequireRole>
            <Grid item xs={12} md={6}>
              <Card>
                <div>
                  <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                    Signin and Registration
                  </h1>
                  <Chart
                    options={{
                      chart: {
                        height: 350,
                        type: "area",
                        id: "signin-signup",
                        events,
                      },
                      dataLabels: {
                        enabled: false,
                      },
                      stroke: {
                        curve: "smooth",
                      },
                      xaxis: {
                        type: "datetime",
                        categories: daysCategorySignIn,
                      },
                      tooltip: {
                        x: {
                          format: "dd/MM/yy",
                        },
                      },
                    }}
                    series={[
                      {
                        name: "Signins",
                        data: signInData,
                      },
                      {
                        name: "Signups",
                        data: signupsData,
                      },
                    ]}
                    type="area"
                    height={350}
                  />
                </div>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <div>
                  <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white place-content-center">
                    Pie Chart
                  </h1>
                  <PieChart data={props.products} />
                </div>
              </Card>
            </Grid>
          </Grid>
        </div>
      </RequireRole>
    </AdminNavProvider>
  );
};

export default AdminPage;

const getTopProducts = async () => {
  let Order = await getOrderModel();

  let top = (
    await Order.aggregate([
      {
        $match: {
          paid: true,
          status: "completed" && "complete",
        },
      },

      {
        $unwind: "$subOrders", // Unwind the subOrders array to have individual documents for each subOrder
      },
      {
        $group: {
          _id: "$subOrders.product",
          productName: { $first: "$subOrders.productName" }, // Include the product name

          totalProductPrice: {
            $sum: {
              $multiply: [
                "$subOrders.productPrice",
                "$subOrders.productQuantity",
              ],
            },
          },
        },
      },
    ])
  ).map((x: any) => {
    return {
      value: x.totalProductPrice,
      label: x.productName,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    };
  });

  // Execute the aggregation pipeline
  return top;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(
    context.req,
    context.res,
    getAuthOptions()
  );

  const token = await requireLoggedInSSP(
    //@ts-ignore
    context.req,
    context.res,
    ["admin", "super_admin"],
    true
  );

  if (!token) {
    return {
      redirect: {
        permanent: false,
        destination: "/admin/orders/list",
      },
    };
  }

  return {
    props: {
      username: session?.user?.name || "",
      products: await getTopProducts(),
    },
  };
}
