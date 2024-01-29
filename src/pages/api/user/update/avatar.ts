import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

import getAssetManager from "@assets/AssetManagerHolder";
import getUserModel from "@models/user";
import requireLoggedIn from "@util/AuthUtils";
import { isAdmin } from "@util/ClientUtils";
import { withFilesCustomSize } from "@util/FileUpload";
import { log } from "@util/log";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(500).json({
      success: false,
      message: "Only POST requests are accepted on this route!",
    });
    return;
  }
  const token = await requireLoggedIn(req, res, ["user"], true);
  if (!token) {
    return;
  }
  // @ts-ignore
  const file = req.files[0];
  if (!file) {
    log("No file");
    res.status(400).json({ error: true, message: "No file provided." });
    return;
  }
  // query: ?user=<id>, optional. If it is set, check if the token has the admin role, if not, return 401
  const userQuery = req.query.user;
  let user;
  if (userQuery) {
    if (!isAdmin(token.user)) {
      res.status(401).json({
        error: true,
        message: "You are not authorized to change other users' avatars.",
      });
      return;
    }
    const UserModel = await getUserModel();
    user = await UserModel.findById(userQuery.toString()).exec();
    if (!user) {
      res.status(400).json({
        error: true,
        message: "User not found.",
      });
      return;
    }
  }
  if (!user) {
    user = token.user;
  }
  if (user.image) {
    await getAssetManager()
      .removeFile(user.image, "image")
      .then(() => {
        log("Removed old image");
      });
  }
  const randomId = Math.random().toString(36).substring(2, 15);
  const newId = await getAssetManager().saveFile(
    randomId,
    file.buffer,
    "image"
  );
  // await user.update({ image: newId });
  // use updateOne instead of update, because update is deprecated
  const UserModel = await getUserModel();
  await UserModel.updateOne({ _id: user._id }, { image: newId }).exec();

  if (userQuery) {
    res.status(200).json({ success: true, message: "Successfully updated." });
    return;
  }

  const refreshTokenObject = {
    id: user.id,
    email: user.email,
    username: user.username,
    use: "refresh",
    origin: "update-avatar",
  };
  const refreshToken = jwt.sign(
    refreshTokenObject,
    `${process.env.NEXTAUTH_SECRET}`,
    {
      expiresIn: "1m",
    }
  );
  res
    .status(200)
    .json({ success: true, message: "Successfully updated.", refreshToken });
}

export default withFilesCustomSize(
  handler,
  process.env.MAX_AVATAR_SIZE || "3mb"
);

export const config = {
  api: {
    bodyParser: false,
  },
};
