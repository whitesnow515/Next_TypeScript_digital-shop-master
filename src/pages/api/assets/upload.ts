import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import getAssetManager from "@util/assets/AssetManagerHolder";
import requireLoggedIn from "@util/AuthUtils";
import withFiles from "@util/FileUpload";
import { log } from "@util/log";
import { supportRoles } from "@util/Roles";

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const token = await requireLoggedIn(req, res, supportRoles, true);
  if (!token) {
    return;
  }
  // @ts-ignore
  const file = req.files[0];
  if (!file) {
    res.status(400).json({ error: true, message: "No file" });
    return;
  }
  const randomId = Math.random().toString(36).substring(2, 15);
  const { type } = req.query;
  await getAssetManager()
    // @ts-ignore
    .saveFileWithType(randomId, file.buffer, "image", type || "")
    .catch((err) => {
      log("err", err);
      res.status(500).json({ error: true, message: err });
    })
    .then((newId) => {
      log("newId", newId);
      res.status(200).json({ id: newId });
    });
};
export default withFiles(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
