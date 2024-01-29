/* eslint-disable */
// @ts-nocheck
import Logger from "@util/log/logger";
import Node from "@util/log/node";

function getLogger(): Logger {
  /*
  if (typeof window !== "undefined") {
    return Browser;
  }
   */
  return Node;
}


function log(...message: any): void {
  getLogger().log(getCallerFileName(), ...message);
}

function error(...message: any): void {
  getLogger().error(getCallerFileName(), ...message);
}

function warn(...message: any): void {
  getLogger().warn(getCallerFileName(), ...message);
}

function info(...message: any): void {
  getLogger().info(getCallerFileName(), ...message);
}

function debug(...message: any): void {
  getLogger().debug(getCallerFileName(), ...message);
}

export { log, error, warn, info, debug, getLogger };

function getCallerFileName() {
  const name = __filename;
  return name.substring(name.indexOf("pages"), name.lastIndexOf("."));
}
