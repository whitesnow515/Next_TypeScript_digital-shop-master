import React from "react";
import getUserModel from "@models/user";
import { getAwaitingVerificationModel } from "@models/order";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";

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
  let { status, sort, search, user, date_to, date_from } = query;
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
  return [queries, filterValues];
};

export const getServerSideProps = async (context: any) => {
  let userModel = await getUserModel();
  let users = await userModel.find();
  let page = await getPage(context.query);
  let [queries, filterValues] = (await getQueries(context.query)) as any;
  var ordercount;
  var orders;

  const ordermodel = await getAwaitingVerificationModel();

  ordercount = await ordermodel.count({ ...queries });
  orders = await ordermodel
    .find({ ...queries }, undefined, {
      skip: page === 1 ? 0 : (page - 1) * 10,
      limit: 10,
    })
    .populate("user")
    .sort([[queries.sort, -1]]);

  if (queries.timestamp) {
    if (queries.timestamp["$gte"]) {
      queries.date_from = queries.timestamp["$gte"].toISOString().split("T")[0];
    }
    if (queries.timestamp["$lt"]) {
      queries.date_to = queries.timestamp["$lt"].toISOString().split("T")[0];
    }
    delete queries["timestamp"];
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
