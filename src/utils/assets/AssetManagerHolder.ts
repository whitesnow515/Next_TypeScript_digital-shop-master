import AssetManager from "./AssetManager";
import FileAssetManager from "./impl/FileAssetManager";
import GridFSAssetManager from "./impl/MongoDBAssetManager";

function getAssetManager(): AssetManager {
  if (process.env.USE_MONGO_FILE_STORAGE === "true") {
    return GridFSAssetManager;
  }
  return FileAssetManager;
}

export default getAssetManager;
