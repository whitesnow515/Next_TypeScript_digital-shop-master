import { NextApiRequest, NextApiResponse } from "next";

import requireLoggedIn from "@util/AuthUtils";
import { log } from "@util/log";
import { adminOnlySettings, requireMethod } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireMethod(req, res, "GET")) {
    try {
      const { id } = req.query;
      if (!id) {
        res.status(400).json({
          success: false,
          message: "No id provided",
        });
        return;
      }
      if (adminOnlySettings.includes(id as string)) {
        const token = await requireLoggedIn(req, res, ["admin"], true);
        if (!token) {
          return;
        }
      }
      const data = await getSetting(id as string, undefined);
      if (!data) {
        res.status(404).json({
          success: false,
          message: "No setting found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      log(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
}

export default handler;
