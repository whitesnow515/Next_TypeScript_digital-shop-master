import { Stream } from "stream";

interface AssetManager {
  getStock(assetName: string, type: string): Promise<Stream>;

  saveStock(assetName: string, data: Buffer, type: string): Promise<string>;

  getFile(id: string, type: string): Promise<Stream>;

  getFileWithMetaType(
    id: string,
    type: string,
    metadataType: string
  ): Promise<Stream>;

  saveFileWithType(
    _id: string,
    data: Buffer,
    type: string,
    metadataType: string
  ): Promise<string>;

  saveFile(id: string, data: Buffer, type: string): Promise<string>;

  removeFile(id: string, type: string): Promise<void>;

  removeFileMetaType(id: string, type: string, metaType: string): Promise<void>;
}

export default AssetManager;
