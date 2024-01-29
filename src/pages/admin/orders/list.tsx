import React, { useEffect } from "react";

import { useSession } from "next-auth/react";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import { Meta } from "@components/templates/Meta";
import moment from "moment";
import { useRouter } from "next/router";
import getUserModel from "@models/user";
import { ArrowDown, ArrowUp } from "phosphor-react";
import getOrderModel, { getPendingOrderModel } from "@models/order";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { OrderInterface } from "@app-types/models/order";
import { Switch } from "@mui/material";
import OrderStatus from "@components/OrderStatus";
import TableView from "@components/TableView";

const OrderPage = ({
  orders,
  page,
  count,
  pages,
  status,
  sort,
  filterValues,
  search,
  date_to,
  date_from,
}: any) => {
  return (
    <>
      <TableView
        orders={orders}
        page={page}
        count={count}
        pages={pages}
        status={status}
        sort={sort}
        filterValues={filterValues}
        search={search}
        date_to={date_to}
        date_from={date_from}
      />
    </>
  );
};

const getPage = (query: { page?: string }): number => {
  if (!query.page) {
    return 1;
  }

  if (!parseInt(query.page)) {
    return 1;
  }
  return parseInt(query.page);
};

const getFilters = () => {
  return [
    { key: "gateway", label: "Gateway", options: ["CASHAPP", "ETHEREUM"] },
    { key: "subOrders.productName", label: "Product" },
    { key: "subOrders.productOption", label: "Option" },
    { key: "email", label: "Email" },
    { key: "username", label: "Username" },
    { key: "longID", label: "Long ID" },
    { key: "_id", label: "ID" },
    { key: "sellix.crypto_address", label: "Crypto Address" },
    { key: "sellix.cashapp_note", label: "CashApp Note" },
  ];
};
const getQueries = (query: any) => {
  let textInputs = getFilters().map((x) => x.key);
  let { status, sort, order, search, user, date_to, date_from } = query;
  var queries: any = {};
  var filterValues: any = {};

  if (date_from || date_to) {
    queries.timestamp = {};
    if (date_to) {
      queries.timestamp["$lt"] = new Date(date_to);
    }
    if (date_from) {
      queries.timestamp["$gte"] = new Date(date_from);
    }
  }
  if (["paid", "pending"].includes(status)) {
    queries["status"] = status;
  }
  if (["timestamp", "totalPrice"].includes(sort)) {
    queries["sort"] = sort;
  }
  if (search) {
    queries.search = search;
  }
  if (user) {
    queries.user = user;
  }

  for (var textInputKey of textInputs) {
    if (!query[textInputKey]) continue;
    queries[textInputKey] = { $regex: query[textInputKey], $options: "i" };
    filterValues[textInputKey] = query[textInputKey];
  }

  if (order && ["asc", "desc"].includes(order)) {
    queries.sort = order === "asc" ? sort : `-${sort}`;
  } else {
    queries.sort = `-${sort}`; // Default to descending order if 'order' is not provided
  }
  return [queries, filterValues];
};

export const getServerSideProps = async (context: any) => {
  let userModel = await getUserModel();
  let users = await userModel.find();
  let page = await getPage(context.query);
  let [queries, filterValues] = await getQueries(context.query);
  var ordercount;
  var orders;

  if (queries.status !== "pending") {
    let ordermodel = await getOrderModel();

    ordercount = await ordermodel.count({ ...queries });
    orders = await ordermodel
      .find({})
      .find({ ...queries }, undefined, {
        skip: page === 1 ? 0 : (page - 1) * 10,
        limit: 10,
      })
      .populate("user")
      .sort([[queries.sort, -1]]);
  } else {
    let ordermodel = await getPendingOrderModel();

    ordercount = await ordermodel.count({ ...queries });
    orders = await ordermodel
      .find({})
      .find({ ...queries }, undefined, {
        skip: page === 1 ? 0 : (page - 1) * 10,
        limit: 10,
      })
      .populate("user")
      .sort([[queries.sort, -1]]);
  }

  if (queries.timestamp) {
    if (queries.timestamp["$gte"]) {
      queries.date_from = queries.timestamp["$gte"].toISOString().split("T")[0];
    }
    if (queries.timestamp["$lt"]) {
      queries.date_to = queries.timestamp["$lt"].toISOString().split("T")[0];
    }
    delete queries["timestamp"];
  }

  if (queries.sort === "-desc") {
    orders.sort((x: any, y: any) => {
      return new Date(y.timestamp).valueOf() - new Date(x.timestamp).valueOf();
    });
  } else {
    orders;
  }
  return {
    props: {
      orders: JSON.parse(JSON.stringify(orders)),
      page,
      pages: Math.ceil(ordercount / 10),
      count: ordercount,
      filterValues,
      ...queries,
      users: JSON.parse(
        JSON.stringify(
          users.map((x) => {
            return {
              label: x.email,
              value: x._id,
            };
          })
        )
      ),
    },
  };
};
export default OrderPage;
