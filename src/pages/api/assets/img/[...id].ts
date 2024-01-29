import { Stream } from "stream";

import { NextApiRequest, NextApiResponse } from "next";

import getAssetManager from "@assets/AssetManagerHolder";
import { requireMethod } from "@util/ServerUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    const { id, type }: any = req.query; // path should be /api/assets/img/[_id]/[imgname]
    if (!id) {
      res.status(400).json({ error: true, message: "Invalid ID (1)" });
      return;
    }
    const idStr = id[0] as string;
    // sanity check - check if the id if it is only a-z, A-Z, 0-9
    if (!idStr.match(/^[a-zA-Z0-9]+$/)) {
      res.status(400).json({ error: true, message: "Invalid ID (2)" });
      return;
    }
    try {
      const imageStream: Stream | void =
        await getAssetManager()?.getFileWithMetaType(
          idStr,
          "image",
          type || ""
        );
      if (!imageStream) {
        res.status(400).json({ error: true, message: "Invalid ID (4)" });
        return;
      }
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      imageStream.pipe(res);
    } catch (e: any) {
      if (e.message === "File not found") {
        res.status(404).json({ error: true, message: "File not found" });
        return;
      }
      if (e.message === "Found asset but wrong type") {
        res
          .status(404)
          .json({ error: true, message: "Found asset, type mismatch!" });
        return;
      }
      if (e.message === "Image data not found") {
        res.status(404).json({ error: true, message: "Image data not found" });
      }
    }
  }
}

export default handler;
