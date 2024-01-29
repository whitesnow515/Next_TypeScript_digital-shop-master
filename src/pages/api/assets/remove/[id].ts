import { NextApiRequest, NextApiResponse } from "next";

import getAssetManager from "@assets/AssetManagerHolder";
import requireLoggedIn from "@util/AuthUtils";
import { error, info } from "@util/log";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "DELETE", "POST")) {
    const token = await requireLoggedIn(req, res, ["admin"], true);
    if (!token) {
      return;
    }
    const { id, type, metaType } = req.query;
    if (!id) {
      res.status(400).json({ success: false, message: "No ID provided" });
      return;
    }
    try {
      info(`Removing asset ${id} of type ${type} and metaType ${metaType}`);
      try {
        await getAssetManager().removeFileMetaType(
          id as string,
          (type as string) || "",
          (metaType as string) || ""
        );
      } catch (e) {
        error(e);
        res.status(500).json({
          success: false,
          message: "Something went wrong",
        });
        return;
      }
      res
        .status(200)
        .json({ success: true, message: "Successfully removed asset." });
    } catch (e) {
      error(e);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
}

export default handler;
