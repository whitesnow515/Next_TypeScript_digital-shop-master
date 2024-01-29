import { Stream } from "stream";

import { ObjectId } from "bson";
import Grid from "gridfs-stream";
import mongoose from "mongoose";

import dbConnect from "@lib/mongoose";
import getFileModel from "@models/file";
import { info, log } from "@util/log";

import AssetManager from "../AssetManager";

const TRUE = 1 + 1 === 2; // stop eslint from complaining
class MongoDBAssetManager implements AssetManager {
  getStock(assetName: string, type: string): Promise<Stream> {
    if (TRUE) throw new Error("GridFS does not work!");
    return new Promise(async (resolve) => {
      const conn = await dbConnect();
      const gridFS = Grid(conn.connection.db, mongoose.mongo);
      resolve(
        gridFS.createReadStream({
          _id: assetName,
          metadata: { type },
        })
      );
    });
  }

  saveStock(assetName: string, data: Buffer, type: string): Promise<string> {
    if (TRUE) throw new Error("GridFS does not work!");
    return new Promise(async (resolve) => {
      const conn = await dbConnect();
      const gridFS = Grid(conn.db, mongoose.mongo);
      const writeStream = gridFS.createWriteStream({
        filename: assetName,
        metadata: { type },
      });
      writeStream.write(data);
      writeStream.end();
      resolve(assetName);
    });
  }

  getFile(id: string, type: string): Promise<Stream> {
    return this.getFileWithMetaType(id, type, "");
  }

  getFileWithMetaType(
    id: string,
    type: string,
    metadataType: string
  ): Promise<Stream> {
    return new Promise(async (resolve, reject) => {
      const FileModel = await getFileModel();
      const image = await FileModel.findOne({
        _id: id,
        type,
      }).exec();
      if (!image) {
        reject(new Error("File not found"));
        return;
      }
      if (
        metadataType &&
        metadataType !== "" &&
        image.metadata.type !== metadataType
      ) {
        reject(new Error("Found asset but wrong type"));
        return;
      }
      const bufferStream = new Stream.PassThrough();
      if (!image || !image.data) {
        reject(new Error("Image data not found"));
        return;
      }
      bufferStream.end(image.data);
      resolve(bufferStream);
    });
  }

  saveFileWithType(
    _id: string,
    data: Buffer,
    type: string,
    metaType: string
  ): Promise<string> {
    log("Saving file");
    return new Promise(async (resolve) => {
      const FileModel = await getFileModel();
      const image = new FileModel({
        data,
        type,
      });
      if (metaType && metaType !== "") {
        image.metadata = {
          type: metaType,
        };
      }
      const result = await image.save();
      resolve(result._id);
    });
  }

  saveFile(_id: string, data: Buffer, type: string): Promise<string> {
    return this.saveFileWithType(_id, data, type, "");
  }

  removeFileMetaType(
    id: string,
    type: string,
    metaType: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const FileModel = await getFileModel();
      const file =
        type && type !== "" // type is optional
          ? await FileModel.findOne({
              _id: new ObjectId(id),
              type,
            })
          : await FileModel.findById(id);
      if (!file) {
        reject(new Error("File not found"));
        return;
      }
      if (metaType && metaType !== "" && file.metadata?.type !== metaType) {
        reject(new Error("Found asset but wrong type"));
        return;
      }
      info(`Deleting file: ${id}`);
      await file
        .deleteOne({
          _id: id,
        })
        .then(() => {
          info(`Deleted file: ${id}`);
        });
      resolve();
    });
  }

  removeFile(id: string, type: string): Promise<void> {
    return this.removeFileMetaType(id, type, "");
  }
}

export default new MongoDBAssetManager();
