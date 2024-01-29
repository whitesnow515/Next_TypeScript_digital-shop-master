import React, { useState } from "react";

import axios, { AxiosProgressEvent } from "axios";
import router from "next/router";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { error, info, log } from "@util/log";
import { getProductCategoryModel } from "@models/product";
import { GetServerSidePropsContext } from "next";
import { requireLoggedInSSP } from "@util/AuthUtils";
import RequireRole from "@components/auth/RequireRole";

const NewProduct = ({ categories }: any) => {
  const session = useSession();
  const [loading, setLoading] = useState<boolean>(false);

  const [errorAlert, setErrorAlert] = useState<string>();

  const handleSubmitAfterImage = (image: string) => {
    axios
      .post("/api/products/add/", {
        name: (document.getElementById("name") as HTMLInputElement)?.value,
        // modifier: (document.getElementById("modifier") as HTMLInputElement)
        //  ?.value,
        image,
        category: (
          document.querySelector('[name="category"]') as HTMLInputElement
        )?.value,
      })
      .then((res) => {
        if (!res.data.error) {
          setLoading(false);
          router.push(`/admin/products`);
        }
      })
      .catch((err) => {
        setLoading(false);
        if (err?.response?.data?.message)
          setErrorAlert(err.response.data.message);
        else setErrorAlert("An error occurred");
      });
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    const attributes = ["name", "price"];
    for (let i = 0; i < attributes.length; i += 1) {
      if (
        (document.getElementById(attributes[i]!) as HTMLInputElement)?.value ===
        ""
      ) {
        setLoading(false);
        return;
      }
    }
    const imageUrl = (document.getElementById("imageUrl") as HTMLInputElement)
      ?.value;
    if (imageUrl && imageUrl.length > 0) {
      handleSubmitAfterImage(imageUrl);
    } else {
      const file = e.target.image.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("files", file);
        const config = {
          headers: { "content-type": "multipart/form-data" },
          onUploadProgress: (event: AxiosProgressEvent) => {
            log(
              `Current progress:`,
              Math.round((event.loaded * 100) / (event.total || 1))
            );
          },
        };
        axios
          .post("/api/assets/upload/?type=product-img", formData, config)
          .then((res) => {
            info(res.data);
            setTimeout(() => {
              handleSubmitAfterImage(res.data.id);
            }, 1000);
          })
          .catch((err) => {
            error(err);
            setErrorAlert("An error occurred while uploading the image.");
          });
      } else {
        handleSubmitAfterImage("");
      }
    }
  };

  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        <CardPage title={"Create a Product"} showTopTitle={false}>
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
                Product Name
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
                htmlFor="image"
                className="block mb-2 text-sm font-medium text-white"
              >
                Image
              </label>
              <input
                type="file"
                name="image"
                id="image"
                placeholder="1"
                className="hover-circle file-upload-input rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300"
              ></input>
            </div>
            <div>
              <label
                htmlFor="category"
                className="block mb-2 text-sm font-medium text-white"
              >
                Category
              </label>
              <select
                id={"select-sort-behavior"}
                className="w-full hover-circle cursor-pointer outline-none px-[10px] py-2 bg-gray-800 text-gray-100 border-2 border-gray-700 rounded-lg"
                name={"category"}
              >
                <option disabled={true} selected={true}>
                  No category selected
                </option>
                {categories.map((option: any) => {
                  return (
                    <option key={option._id} value={option._id}>
                      {option.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label
                htmlFor="imageUrl"
                className="block mb-2 text-sm font-medium text-white"
              >
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                id="imageUrl"
                placeholder="https://example.com/picture.png"
                className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
              ></input>
            </div>
            <FormButton type={"submit"} loading={loading} style="mb-[30px]">
              Create
            </FormButton>
            <a href="/admin/products">
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

export default NewProduct;
