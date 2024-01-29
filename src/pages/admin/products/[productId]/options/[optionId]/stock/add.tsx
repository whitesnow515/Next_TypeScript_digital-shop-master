import React, { useState } from "react";

import axios, { AxiosProgressEvent } from "axios";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { HiArrowNarrowLeft } from "react-icons/hi";

import AdminNavProvider from "@components/admin/AdminNavProvider";
import Alert from "@components/Alert";
import CardPage from "@components/CardPage";
import FormButton from "@components/FormButton";
import { debug, info } from "@util/log";
import { UploadState } from "@util/UploadProgress";
import RequireRole from "@components/auth/RequireRole";

const StockAddPage = () => {
  const session = useSession();
  const router = useRouter();
  const { productId, optionId } = router.query;
  const [loading, setLoading] = useState<boolean>(false);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE);

  const [errorAlert, setErrorAlert] = useState<string>();
  const handleSubmit = (e: any) => {
    e.preventDefault();
    const hasFile = e.target.files.files.length > 0;
    debug("Has File", hasFile);
    if (hasFile) {
      setLoading(true);
      const formData = new FormData();
      debug(e.target.files.files);
      formData.append("files", e.target.files.files[0]);
      for (let i = 1; i < e.target.files.files.length; i += 1) {
        formData.append("files", e.target.files.files[i]);
      }
      setUploadState(UploadState.UPLOADING);
      axios
        .post(
          `/api/stock/upload/${productId as string}/${
            optionId as string
          }/file/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              const { loaded, total } = progressEvent;
              const percent = Math.floor((loaded * 100) / (total || 1));
              if (percent < 100) {
                info("Upload progress", percent);
                setUploadProgress(percent);
              }
            },
          }
        )
        .then((res) => {
          if (!res.data.error) {
            router.push(
              `/admin/products/${productId}/options/${optionId}/stock?info=Succesfully added stock! (Success: ${
                res.data.successNum
              }, Failed: ${res.data.errors || 0})`
            );
          } else {
            setErrorAlert(
              `${res.data.message} (Success: ${res.data.successNum}, Failed: ${
                res.data.errors || 0
              })`
            );
          }
        })
        .catch((err) => {
          if (err?.response?.data?.message)
            setErrorAlert(
              `${err.response.data.message} (Success: ${
                err.response.data.successNum
              }, Failed: ${err.response.data.errors || 0})`
            );
          else setErrorAlert("An error occurred");
        })
        .finally(() => {
          setLoading(false);
          setUploadProgress(0);
          setUploadState(UploadState.IDLE);
        });
    } else {
      setErrorAlert("Please select a file");
    }
  };
  return (
    <AdminNavProvider session={session}>
      <RequireRole admin>
        <CardPage title={"Add Stock"} showTopTitle={false}>
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
                htmlFor="files"
                className="block mb-2 text-sm font-medium text-white"
              >
                File(s)
              </label>
              <input
                type="file"
                name="files"
                id="files"
                placeholder="1"
                multiple
                className="hover-circle file-upload-input rounded-lg block w-full p-2.5 bg-[#141716] border-gray-600 placeholder-gray-400 text-white focus:border-primary-500 duration-300"
              ></input>
            </div>
            <FormButton
              type={"submit"}
              loading={loading}
              style="mb-[30px]"
              uploadProgress={{
                progress: uploadProgress,
                state: uploadState,
              }}
            >
              Create
            </FormButton>
            <a href={`/admin/products/${productId}/options/${optionId}/stock/`}>
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

export default StockAddPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {},
  };
}
