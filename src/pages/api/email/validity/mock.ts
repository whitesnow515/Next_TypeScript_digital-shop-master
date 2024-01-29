import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    valid: false,
    error: false,
    invalid: true,
    message: "Invalid email!!!",
  });
}
