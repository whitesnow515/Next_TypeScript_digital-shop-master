/* eslint-disable no-console */
import chalk from "chalk";

import Logger from "@util/log/logger";

class Node implements Logger {
  debug(classifier: string, ...message: any): void {
    const inBrowser = this.inBrowser();
    if (typeof message[0] === "string") {
      console.log(
        chalk.blue("[DEBUG]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        message.join(" ")
      );
    } else {
      console.log(
        chalk.blue("[DEBUG]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        ...message
      );
    }
  }

  error(classifier: string, ...message: any): void {
    const inBrowser = this.inBrowser();
    if (typeof message[0] === "string") {
      console.log(
        chalk.red("[ERROR]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        message.join(" ")
      );
    } else {
      console.log(
        chalk.red("[ERROR]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        ...message
      );
    }
  }

  info(classifier: string, ...message: any): void {
    const inBrowser = this.inBrowser();
    if (typeof message[0] === "string") {
      console.log(
        chalk.cyan("[INFO]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        message.join(" ")
      );
    } else {
      console.log(
        chalk.cyan("[INFO]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        ...message
      );
    }
  }

  log(classifier: string, ...message: any): void {
    this.info(classifier, ...message);
  }

  warn(classifier: string, ...message: any): void {
    const inBrowser = this.inBrowser();
    if (typeof message[0] === "string") {
      console.log(
        chalk.yellow("[WARN]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        message.join(" ")
      );
    } else {
      console.log(
        chalk.yellow("[WARN]"),
        classifier && classifier !== ""
          ? inBrowser
            ? `[${classifier}]`
            : chalk.green(`[${classifier}]`)
          : "",
        ...message
      );
    }
  }

  inBrowser(): boolean {
    // chalk supports browser, but seems to only work on the first "prefix" of the log message
    return typeof window !== "undefined";
  }
}

export default new Node();
