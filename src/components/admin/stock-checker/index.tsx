import React from "react";

import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import Swal from "sweetalert2";

import { ProductInterface } from "@app-types/models/product";
import RequireRole from "@components/auth/RequireRole";
import Card from "@components/Card";
import FormButton from "@components/FormButton";
import KeyValueFieldArray from "@components/kv-field-array";

type StockCheckerSettingsProps = {
  product: ProductInterface;
};
const StockCheckerSettings = ({ product }: StockCheckerSettingsProps) => {
  const snackbar = useSnackbar();

  const [keycheck, setKeycheck] = React.useState(
    product.stockCheckerConfig?.keycheck ?? {}
  );

  const handleSave = () => {
    const name = document.getElementById(
      "stock-checker-name"
    ) as HTMLInputElement;
    const wordlisttype = document.getElementById(
      "stock-checker-wordlisttype"
    ) as HTMLInputElement;
    const enabled = document.getElementById(
      "stock-checker-enable-switch"
    ) as HTMLInputElement;
    const enableAutoCheck = document.getElementById(
      "stock-checker-auto-check-switch"
    ) as HTMLInputElement;
    /* const replacer = document.getElementById(
      "stock-checker-replacer-switch"
    ) as HTMLInputElement;
     */
    const proxies = document.getElementById(
      "stock-checker-proxies"
    ) as HTMLInputElement;
    return axios
      .post(`/api/products/update/stock-checker`, {
        name: name.value,
        wordlisttype: wordlisttype.value,
        enabled: enabled.checked,
        productId: product._id,
        enableAutoCheck: enableAutoCheck.checked,
        // enableAutoReplace: replacer.checked,
        proxies: proxies.value.trim().split("\n"),
        keycheck,
      })
      .then(() => {
        snackbar.enqueueSnackbar("Saved!", {
          variant: "success",
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response.data.message || err.message,
        });
      });
  };

  return (
    <RequireRole admin>
      <Grid item xs={12} md={8}>
        <Card>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl place-content-center">
              Stock Checker
            </h1>
            <div className="flex flex-col items-center pt-3 gap-3">
              <div className={"w-full flex flex-col"}>
                <label
                  htmlFor="stock-checker-name"
                  className="block text-sm font-medium text-white"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="stock-checker-name"
                  id="stock-checker-name"
                  placeholder="Name"
                  required
                  defaultValue={product.stockCheckerConfig?.name}
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                />
              </div>
              <div className={"w-full flex flex-col"}>
                <label
                  htmlFor="stock-checker-wordlisttype"
                  className="block text-sm font-medium text-white"
                >
                  Wordlist Type
                </label>
                <input
                  type="text"
                  name="stock-checker-wordlisttype"
                  id="stock-checker-wordlisttype"
                  placeholder="Wordlist Type"
                  defaultValue={
                    product.stockCheckerConfig
                      ? product.stockCheckerConfig?.wordlisttype
                      : "Credentials"
                  }
                  className="outline-none hover-circle border sm:text-sm rounded-lg block w-full p-2.5 bg-transparent border-[#6A6B74] hover:border-[#9799A6] placeholder-gray-400 text-white focus:border-[#FFFFFF] duration-150 mb-4"
                />
              </div>
              <div className={"w-full flex flex-col"}>
                <label className="block text-sm font-medium text-white">
                  Keycheck
                </label>
                <div className={"py-4"}>
                  <KeyValueFieldArray
                    initialValues={keycheck}
                    onChange={(newValues) => {
                      setKeycheck(newValues);
                    }}
                  />
                </div>
              </div>
              <div className={"w-full flex flex-col"}>
                <label htmlFor={"stock-checker-proxies"}>Proxies</label>
                <TextField
                  id="stock-checker-proxies"
                  label="Proxies"
                  variant="outlined"
                  multiline
                  rows={4}
                  className={"w-full pb-2"}
                  defaultValue={product?.stockCheckerConfig?.proxies?.join(
                    "\n"
                  )}
                />
              </div>
            </div>
            <div className={"flex flex-row py-2 w-full"}>
              <FormControlLabel
                label={"Enable"}
                control={
                  <Switch
                    id={"stock-checker-enable-switch"}
                    defaultChecked={product.stockCheckerConfig?.enabled}
                  />
                }
              />
              <span className={"pr-4 text-gray-600 text-2xl"}>|</span>
              <FormControlLabel
                label={"Enable Auto Check"}
                control={
                  <Switch
                    id={"stock-checker-auto-check-switch"}
                    defaultChecked={product.stockCheckerConfig?.enableAutoCheck}
                  />
                }
              />
            </div>
            <span className={"text-gray-400"}>
              Make sure to press the save button above to save changes to
              keycheck.

            </span>
            <FormButton className="w-full mt-4" onClickLoading={handleSave}>
              Save
            </FormButton>
          </div>
        </Card>
      </Grid>
    </RequireRole>
  );
};

export default StockCheckerSettings;
