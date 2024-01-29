import React, { useState } from "react";

import axios, { AxiosProgressEvent } from "axios";
import router, { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { error, info, log } from "@util/log";
import { X } from "phosphor-react";
import { GetServerSidePropsContext } from "next";
import { getSetting } from "@util/SettingsHelper";
import { getProductCategoryModel } from "@models/product";
import { requireLoggedInSSP } from "@util/AuthUtils";
import RequireRole from "@components/auth/RequireRole";

const NewProduct = ({ categories }: any) => {
  const session = useSession();
  const [loading, setLoading] = useState<boolean>(false);

  const [errorAlert, setErrorAlert] = useState<string>();
  const [newStr, setNewStr] = React.useState<string>();
  const [load, setLoad] = React.useState<boolean>();
  const router = useRouter();

  const handleSubmit = () => {
    setLoad(true);
    axios
      .post("/api/admin/categories/", {
        category: newStr,
      })
      .then((res) => {
        setLoad(false);
        router.replace(router.asPath);
      })
      .catch((err) => {
        setLoad(false);
        if (err?.response?.data?.message)
          setErrorAlert(err.response.data.message);
        else setErrorAlert("An error occurred");
      });
  };

  const deleteCategory = (id: string) => {
    axios
      .post(`/api/admin/categories/${id}/`)
      .then((res) => {
        router.replace(router.asPath);
      })
      .catch((err) => {
        if (err?.response?.data?.message)
          setErrorAlert(err.response.data.message);
        else setErrorAlert("An error occurred");
      });
  };
  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        <CardPage title={"Categories"} showTopTitle={false}>
          {errorAlert && (
            <Alert
              type={"error"}
              dismissible
              onDismiss={() => setErrorAlert("")}
            >
              {errorAlert}
            </Alert>
          )}
          <div className={""}>
            {categories.map((ctg: any) => (
              <div
                className={
                  "bg-[#303633] mb-4 py-2 px-4 rounded-md box-border flex items-center justify-between items-center text-white"
                }
              >
                <div>{ctg.name}</div>
                <div
                  className={"hover:cursor-pointer"}
                  onClick={() => deleteCategory(ctg._id)}
                >
                  <X color={"gray"} size={19} />
                </div>
              </div>
            ))}
            <div
              className={
                "flex bg-[#2B313E] focus-within:outline-[#545B6B] focus-within:outline rounded-md py-2 px-4"
              }
            >
              <input
                value={newStr}
                onChange={(e) => setNewStr(e.target.value)}
                className={
                  "bg-transparent active:outline-none focus:outline-none w-full rounded-md"
                }
                placeholder={"New category"}
              />
              <div
                onClick={handleSubmit}
                className={`bg-[#065DE1] rounded-md px-3 py-1 text-sm ${
                  loading && "opacity-40 pointer-events-none"
                }`}
              >
                Add
              </div>
            </div>
          </div>
        </CardPage>
      </RequireRole>
    </AdminNavProvider>
  );
};

export default NewProduct;

export async function getServerSideProps(
  context: GetServerSidePropsContext | any
) {
  const token = await requireLoggedInSSP(
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
  const category = await getProductCategoryModel();
  const categories = await category.find().lean().exec();
  return {
    props: {
      categories: JSON.parse(JSON.stringify(categories)),
    },
  };
}
