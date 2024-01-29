import axios from "axios";

import { getSetting } from "@util/SettingsHelper";

export type StockCheckerData = {
  name: string;
  keycheck: any;
  wordlisttype: string;
  proxy?: string | null;
  data: string[];
  maxRetries: number;
};
export type StockCheckerStatus = "fail" | "success" | string;
export type StockCheckerResponse = {
  index: number;
  data: string;
  status: StockCheckerStatus;
  message?: string;
};
export default async function checkStockValidity(
  data: StockCheckerData
): Promise<StockCheckerResponse[]> {
  const stockCheckerApiUrl = await getSetting("stockCheckerApiUrl", "");
  if (!stockCheckerApiUrl) {
    return data.data.map((d, i) => {
      return {
        index: i,
        data: d,
        status: "success",
        message: "No stock checker API URL set.",
      };
    }) as StockCheckerResponse[];
  }
  try {
    const res = await axios.post(stockCheckerApiUrl, data, {
      timeout: await getSetting("stockCheckerTimeout", 4 * 60 * 1000),
      timeoutErrorMessage: "Axios timeout",
    });
    return res.data as StockCheckerResponse[];
  } catch (e: any) {
    return data.data.map((d, i) => {
      return {
        index: i,
        data: d,
        status: "error",
        message: e.message,
      };
    });
  }
}
export const buildNotesMessage = (responses: StockCheckerResponse[]) => {
  let notesBuilder = "";
  // sort by index
  responses
    .sort((a, b) => {
      return a.index - b.index;
    })
    .forEach((r) => {
      notesBuilder += `\n${r.status}: ${r.index} - ${r.data} - ${r.message}`;
    });
  return notesBuilder;
};
export const shouldSendToQueue = (responses: StockCheckerResponse[]) => {
  // return true if any response has a status that is not success
  return responses.some((r) => {
    return r.status !== "success";
  });
};
