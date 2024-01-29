import { NextApiRequest, NextApiResponse } from "next";

import { debug } from "@util/log";
import { StockCheckerData, StockCheckerResponse } from "@util/stock/checker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body = req.body as StockCheckerData;
  debug(body);
  const data: StockCheckerResponse[] = [];
  let a = false;
  body.data.forEach((d, i) => {
    if (Math.random() > 0.5 && !a) {
      a = true;
      data.push({
        index: i,
        data: d,
        status: "api_error",
        message: "Random error",
      });
      return;
    }
    const num = parseInt(d, 10);
    if (num) {
      data.push({
        index: i,
        data: d,
        status: "success",
        message: "Even number",
      });
    } else {
      data.push({
        index: i,
        data: d,
        status: "fail",
        message: "Odd number",
      });
    }
  });
  res.status(200).json(data);
}
