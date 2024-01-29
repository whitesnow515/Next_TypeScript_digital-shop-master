import multer from "multer";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { debug, log } from "@util/log";

function getSize(maxSize: string) {
  const size = maxSize.replace(/[^0-9]/g, "");
  const unit = maxSize.replace(/[^a-z]/g, "");
  let multiplier = 1;
  switch (unit) {
    case "kb":
      multiplier = 1024;
      break;
    case "mb":
      multiplier = 1024 * 1024;
      break;
    case "gb":
      multiplier = 1024 * 1024 * 1024;
      break;
    default:
      break;
  }
  return parseInt(size, 10) * multiplier;
}

function calcMaxFileSize() {
  const maxSize: string = (process.env.MAX_BODY_SIZE as string) || "30mb"; // example: "10gb"
  return getSize(maxSize);
}

// @ts-ignore
let cached = global.maxFileSize;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.maxFileSize = calcMaxFileSize();
}

function getMaxFileSize() {
  if (cached) {
    return cached;
  }
  return calcMaxFileSize();
}

const withFilesCustomSizeNum = (
  handler: NextApiHandler,
  maxSize: number
): NextApiHandler => {
  // eslint-disable-next-line consistent-return
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "POST") {
      debug("withFiles, max size: ", maxSize, "bytes");
      const upload = multer({
        limits: { fileSize: maxSize },
        storage: multer.memoryStorage(),
      });
      log("withFiles");
      const thing = await upload.array("files");
      // @ts-ignore
      await thing(req, res, async (err: any) => {
        if (err) {
          log("err", err);
          res.status(500).json({ error: true, message: err });
          throw err;
        }
        return handler(req, res);
      });
    } else {
      return handler(req, res);
    }
  };
};
const withFilesCustomSize = (
  handler: NextApiHandler,
  maxSize: string
): NextApiHandler => {
  return withFilesCustomSizeNum(handler, getSize(maxSize));
};
const withFiles = (handler: NextApiHandler): NextApiHandler => {
  return withFilesCustomSizeNum(handler, getMaxFileSize());
};

export default withFiles;
export { withFilesCustomSize, withFilesCustomSizeNum };
