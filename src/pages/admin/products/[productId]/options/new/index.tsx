import React, { useEffect, useState } from "react";

import axios from "axios";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { info } from "@util/log";
import RequireRole from "@components/auth/RequireRole";

const NewOption = () => {
  const session = useSession();
  const router = useRouter();
  const { productId } = router.query;
  const [loading, setLoading] = useState<boolean>(false);

  const [errorAlert, setErrorAlert] = useState<string>();
  useEffect(() => {
    info("productId", productId);
  }, [productId]);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    axios
      .post("/api/products/update/options/add/", {
        productId: productId as string,
        name: e.target.name.value,
        price: e.target.price.value,
      })
      .then((res) => {
        if (!res.data.error) {
          router.push(`/admin/products/${productId}`);
        }
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
        <CardPage title={"Create an option"} showTopTitle={false}>
          {errorAlert && (
            <Alert
              type={"error"}
              dismissible
              onDismiss={() => setErrorAlert("")}
            >
              {errorAlert}
            </Alert>
          )}
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-white"
              >
                Option Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                placeholder="Apples"
                required={true}
              ></input>
            </div>
            <div>
              <label
                htmlFor="price"
                className="block mb-2 text-sm font-medium text-white"
              >
                Price
              </label>
              <input
                type="number"
                step={0.01}
                name="price"
                id="price"
                placeholder="0"
                className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                required={true}
              ></input>
            </div>
            <FormButton type={"submit"} loading={loading} style="mb-[30px]">
              Create
            </FormButton>
            <a href={`/admin/products/${productId}`}>
              <span className="text-sm hover-circle hover:cursor-pointer font-medium hover:underline text-white float-left pb-5 mt-[30px]">
                <HiArrowNarrowLeft className="inline-block mr-1" />
                Back
              </span>
            </a>
          </form>
        </CardPage>
      </RequireRole>
    </AdminNavProvider>
  );
};

export default NewOption;
