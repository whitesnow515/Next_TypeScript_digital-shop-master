import { promises as fs } from "fs";
import { Stream } from "stream";

import AssetManager from "../AssetManager";

class FileAssetManager implements AssetManager {
  getStock(assetName: string): Promise<Stream> {
    return new Promise(async (resolve) => {
      const bufferStream = new Stream.PassThrough();
      bufferStream.end(await fs.readFile(`./assets/${assetName}`));
      resolve(bufferStream);
    });
  }

  saveStock(assetName: string, data: Buffer, type: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  getFile(id: string): Promise<Stream> {
    return new Promise(async (resolve) => {
      const bufferStream = new Stream.PassThrough();
      bufferStream.end(await fs.readFile(`./assets/${id}`));
      resolve(bufferStream);
    });
  }

  removeFile(id: string): Promise<void> {
    return new Promise(async (resolve) => {
      resolve(await fs.unlink(`./assets/${id}`));
    });
  }

  saveFile(id: string, data: Buffer): Promise<string> {
    return new Promise(async (resolve) => {
      await fs.writeFile(`./assets/${id}`, data);
      resolve(id);
    });
  }

  getFileWithMetaType(
    id: string,
    type: string,
    metadataType: string
  ): Promise<Stream> {
    throw new Error("Method not implemented.");
  }

  saveFileWithType(
    _id: string,
    data: Buffer,
    type: string,
    metadataType: string
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  removeFileMetaType(
    id: string,
    type: string,
    metaType: string
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export default new FileAssetManager();
