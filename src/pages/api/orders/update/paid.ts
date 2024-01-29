import { NextApiRequest, NextApiResponse } from "next";

import { setPaid } from "@util/orders";
import { requireMethod } from "@util/ServerUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (requireMethod(req, res, "POST")) {
    await setPaid(req, res);
  }
}
