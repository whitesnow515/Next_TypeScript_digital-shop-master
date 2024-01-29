import React, { useEffect, useState } from "react";

import { Editor } from "@monaco-editor/react";
import axios from "axios";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useSnackbar } from "notistack";

import AppWrapper from "@components/AppWrapper";
import FormButton from "@components/FormButton";
import { Meta } from "@components/templates/Meta";
import { copyToClipboard } from "@pages/pay/cashapp/[id]";
import { AppConfig } from "@util/AppConfig";
import { error } from "@util/log";

const ViewStockPage = ({
  id,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const snackbar = useSnackbar();
  const [data, setData] = useState("Loading...");
  const [errors, setErrors] = useState(false);
  const [isMount, setIsMount] = useState(false);

  useEffect(() => {
    setIsMount(true);
    getStock();
  }, [id, isMount]);

  const getStock = () => {
    if (isMount) {
      axios
        .get(`/api/stock/${id}/get/raw`)
        .then((res) => {
          setData(res.data.toString());
          setErrors(false);
        })
        .catch((err) => {
          error(err);
          setErrors(true);
          let friendlyMessage = err.response?.data?.message;
          setData(friendlyMessage);
          if (!friendlyMessage && err.response?.status === 401) {
            friendlyMessage = "You are not authorized to view this!";
          } else if (!friendlyMessage) {
            friendlyMessage = "An unknown error occurred!";
          }
          snackbar.enqueueSnackbar(friendlyMessage, {
            variant: "error",
          });
        });
    }
  };
  return (
    <AppWrapper>
      <Meta title={`View Order`} description={AppConfig.site_name} />
      {errors ? (
        <div className="antialiased flex items-center justify-center mt-4 text-gray-600 min-h-[calc(100vh-171px)]">
          <p className="text-white">Order is in awaiting verification</p>
        </div>
      ) : (
        <div className="antialiased mt-4 text-gray-600 min-h-[calc(100vh-171px)]">
          <h1 className="title-gradient text-3xl font-bold text-center pb-4">
            View Stock
          </h1>
          <div id={"actions"} className={"py-4 flex justify-center"}>
            <FormButton
              fullWidth={false}
              className={"mr-2"}
              onClick={() => {
                window.location.href = `/stock/${id}/raw`;
              }}
            >
              Raw
            </FormButton>
            <FormButton
              fullWidth={false}
              className={"mr-2"}
              onClick={() => {
                if (!copyToClipboard(data)) {
                  snackbar.enqueueSnackbar(
                    "Clipboard not supported on your browser!",
                    {
                      variant: "error",
                    }
                  );
                }
                snackbar.enqueueSnackbar("Copied to clipboard", {
                  variant: "success",
                });
              }}
            >
              Copy
            </FormButton>
            <FormButton
              fullWidth={false}
              onClick={() => {
                // download file
                const element = document.createElement("a");
                const file = new Blob([data], {
                  type: "text/plain",
                });
                element.href = URL.createObjectURL(file);
                element.download = `${id}.txt`;
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
                if (element.parentNode) {
                  element.parentNode.removeChild(element);
                }
              }}
            >
              Download
            </FormButton>
          </div>
          <div id={"editor-div"}>
            <Editor
              height={"80vh"}
              value={data}
              defaultLanguage={"plaintext"}
              theme={"vs-dark"}
              options={{
                readOnly: true,
              }}
              onMount={(editor, monaco) => {
                const editorDiv = document.getElementById("editor-div");
                if (editorDiv) {
                  const editorDivSection =
                    editorDiv.getElementsByTagName("section")[0];
                  if (editorDivSection) {
                    editorDivSection.style.margin = "0";
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </AppWrapper>
  );
};

export default ViewStockPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  return {
    props: {
      id,
    },
  };
}
