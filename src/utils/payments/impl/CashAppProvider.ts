import { promises as fs } from "fs";

import axios from "axios";
import Connection from "node-imap";

import { OrderInterface } from "@app-types/models/order";
import { UserInterface } from "@app-types/models/user";
import { CashAppReceipt } from "@app-types/payment/cashapp";
import { debug, error, info, log } from "@util/log";
import { PaymentProvider } from "@util/payments/PaymentProvider";
import { getRandomProxyAgent } from "@util/ServerUtils";
import { getSetting } from "@util/SettingsHelper";

const TRUE = true;

export class CashAppProvider implements PaymentProvider {
  name = "CashApp";

  iconUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Square_Cash_app_logo.svg/1200px-Square_Cash_app_logo.svg.png";

  private imapConnection: Connection | undefined;

  private ready = false;

  //  queue to ensure that the connection is established
  private promiseQueue: Promise<any> = new Promise(async (resolve, reject) => {
    if (process.env.CASHAPP_PAYMENTS === "true") {
      log("Initializing CashAppProvider");
      this.imapConnection = new Connection({
        user: process.env.IMAP_USER || "",
        password: process.env.IMAP_PASSWORD || "",
        host: process.env.IMAP_HOST || "",
        port: parseInt(process.env.IMAP_PORT || "993", 10),
        tls: process.env.IMAP_TLS === "true",
      });
      this.imapConnection.once("ready", () => {
        info("IMAP connection established");
        this.ready = true;
        resolve(this.imapConnection);
      });

      this.imapConnection.once("error", (err) => {
        error(err);
        reject(err);
      });
      await this.init();
    }
  });

  formatDecimals(amount: number) {
    // if a whole number (like 2), return "2"
    // else format to 2 decimal places
    return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  }

  async createPayment(
    order: OrderInterface,
    user: UserInterface | null
  ): Promise<string> {
    const length = await getSetting("cashAppIdLength", 6);
    const words = await getSetting("cashAppIdWords", false);
    if (words) {
      // check if wordlist.txt exists
      const wordlistExists = await fs
        .access("wordlist.txt")
        .then(() => true)
        .catch(() => false);
      if (!wordlistExists) {
        // GET https://random-word-api.vercel.app/api?words={length}
        const id = await axios
          .get(`https://random-word-api.vercel.app/api?words=${length}`)
          .then((res) => res.data)
          .catch((e) => {
            error(e);
            return [];
          });
        order.shortId = id.join(" ");
      } else {
        // read some random words from wordlist.txt
        const wordlist = await fs
          .readFile("wordlist.txt", "utf8")
          .then((res) => res.split("\n"))
          .catch((e) => {
            error(e);
            return [];
          });
        const id = [];
        for (let i = 0; i < length; i += 1) {
          id.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
        }
        order.shortId = id.join(" ");
      }
    } else {
      order.shortId = Math.random()
        .toString(36)
        .substring(2, length + 2)
        .toUpperCase();
    }
    return Promise.resolve(`/pay/cashapp/${order._id?.toString()}`);
  }

  verifyPayment(
    paymentId: string,
    amount: number,
    // markRead = false,
    unseenOnly = true
  ): Promise<{
    success: boolean;
    awaitingAccept?: boolean;
  }> {
    return this.promiseQueue.then(() => {
      if (!this.imapConnection || !this.ready) {
        throw new Error("IMAP connection is not initialized");
      }
      // debug("Verifying payment", paymentId, amount);
      return new Promise((resolve, reject) => {
        this.openInbox((err, box) => {
          if (err) {
            error(err);
            reject(new Error("Error opening inbox"));
            return;
          }
          const searchCriteria: any = [unseenOnly ? "UNSEEN" : "ALL"];
          if (TRUE) {
            const search = `sent you $${this.formatDecimals(
              amount
            )} for ${paymentId}`;
            // debug("Searching for email", search);
            searchCriteria.push(["SUBJECT", search]);
          } else {
            searchCriteria.push(
              ["SUBJECT", "CashApp Payment Received"],
              ["TEXT", paymentId]
            );
          }
          if (process.env.CASHAPP_TESTING !== "true") {
            searchCriteria.push(["FROM", "cash@square.com"]);
          }
          const fetchOptions = {
            bodies: ["HEADER", "TEXT"],
          };
          // debug("Searching for email", searchCriteria);
          this.imapConnection?.search(searchCriteria, (err2, uids) => {
            if (err2) {
              error(err2);
              reject(err2);
              return;
            }
            if (uids.length === 0) {
              resolve({
                success: false,
                awaitingAccept: false,
              });
              return;
            }
            const fetch = this.imapConnection?.fetch(uids, fetchOptions);
            if (!fetch) {
              reject(new Error("Error fetching email"));
              return;
            }
            if (TRUE) {
              // check the body for "More information is required to accept this payment"
              fetch.on("message", (msg) => {
                let data = "";
                msg.on("body", (stream) => {
                  stream.on("data", (chunk) => {
                    data += chunk.toString("utf8");
                  });
                  stream.on("end", () => {
                    if (!data) {
                      debug("No data found");
                      resolve({
                        success: false,
                        awaitingAccept: false,
                      });
                      return;
                    }
                    const matchAwaitingAccept = data.match(
                      /More information is required to accept this payment/
                    );
                    const matchSuccess = data.match(
                      /To view your receipt, visit:/g
                    );
                    debug({ matchAwaitingAccept, matchSuccess });
                    if (matchAwaitingAccept && matchSuccess) {
                      resolve({
                        success: false,
                        awaitingAccept: true,
                      }); // require manual accept
                      return;
                    }
                    resolve({
                      success: !!matchSuccess,
                      awaitingAccept: !!matchAwaitingAccept,
                    });
                  });
                });
              });
            }
          });
        });
      });
    });
  }

  finalizePayment(paymentId: string, amount: number): Promise<void> {
    // find the email and mark it as read
    return this.promiseQueue.then(() => {
      if (!this.imapConnection || !this.ready) {
        throw new Error("IMAP connection is not initialized");
      }
      return new Promise((resolve, reject) => {
        this.openInbox((err, box) => {
          if (err) {
            error(err);
            reject(new Error("Error opening inbox"));
            return;
          }
          // implement search
          const searchCriteria: any = ["UNSEEN"];
          if (TRUE) {
            searchCriteria.push([
              "SUBJECT",
              `sent you $${this.formatDecimals(amount)} for ${paymentId}`,
            ]);
          } else {
            searchCriteria.push(
              ["SUBJECT", "CashApp Payment Received"],
              ["TEXT", paymentId]
            );
          }
          if (process.env.CASHAPP_TESTING !== "true") {
            searchCriteria.push(["FROM", "cash@square.com"]);
          }
          const fetchOptions = {
            bodies: ["HEADER", "TEXT"],
          };
          this.imapConnection?.search(searchCriteria, (err2, uids) => {
            if (err2) {
              error(err2);
              reject(err2);
              return;
            }
            if (uids.length === 0) {
              resolve();
              return;
            }
            const fetch = this.imapConnection?.fetch(uids, fetchOptions);
            if (!fetch) {
              reject(new Error("Error fetching email"));
              return;
            }
            if (!TRUE) {
              fetch?.on("message", (msg) => {
                let data = "";
                msg.on("body", (stream) => {
                  stream.on("data", (chunk) => {
                    data += chunk.toString("utf8");
                  });
                  stream.on("end", () => {
                    debug("End");
                    if (!data) {
                      debug("No data found");
                      resolve();
                      return;
                    }
                    const match = data.match(
                      /payment of \$(\d+(?:\.\d+)?) from \$(\w+) has been received!/
                    );
                    const noteMatch = data.match(/Note: (\w+)/i);
                    let validAmount = match && match[1] === amount.toString();
                    let validNote = noteMatch && noteMatch[1] === paymentId;
                    if (match) {
                      debug({ a: match[1] });
                    }
                    if (noteMatch) {
                      debug({ n: noteMatch[1] });
                    }
                    if (validAmount === null) {
                      validAmount = false;
                    }
                    if (validNote === null) {
                      validNote = false;
                    }
                    debug({ validAmount, validNote });
                    const valid = validAmount && validNote;
                    if (valid) {
                      debug("Marking as read");
                      this.imapConnection?.setFlags(
                        uids,
                        ["\\Seen"],
                        (err3) => {
                          if (err3) {
                            error(err3);
                            reject(err3);
                            return;
                          }
                          resolve();
                        }
                      );
                    }
                    resolve();
                  });
                });
              });
            } else {
              debug("Marking as read");
              this.imapConnection?.setFlags(uids, ["\\Seen"], (err3) => {
                if (err3) {
                  error(err3);
                  reject(err3);
                  return;
                }
                resolve();
              });
            }
          });
        });
      });
    });
  }

  checkReceipt(
    cashAppId: string,
    order: OrderInterface,
    settings?: {
      allowProxy?: boolean;
    }
  ): Promise<{
    success: boolean;
    awaitingAccept: boolean;
    resultString: string;
  }> {
    return new Promise(async (resolve, reject) => {
      const cashAppReceiptChecking = await getSetting(
        "cashAppReceiptChecking",
        true
      );
      if (!cashAppReceiptChecking) {
        reject(new Error("CashApp receipt checking is disabled"));
      }
      const receiptCheckingProxy = await getSetting(
        "receiptCheckingProxy",
        false
      );
      let client;
      if (receiptCheckingProxy) {
        try {
          const agent = await getRandomProxyAgent();
          if (!agent) {
            reject(new Error("No proxy agent found"));
            return;
          }
          const baseUrl = "https://cash.app";
          client = axios.create({
            baseURL: baseUrl,
            httpsAgent: agent,
          });
        } catch (e) {
          error(e);
          reject(e);
          return;
        }
      } else {
        client = axios.create({
          baseURL: "https://cash.app",
        });
      }
      const data = await client.get(`/receipt-json/f/${cashAppId}/`);
      if (data.status !== 200) {
        reject(new Error("Invalid status code"));
        return;
      }
      const receipt = data.data as CashAppReceipt;
      if (receipt.is_action_required) {
        resolve({
          success: false,
          awaitingAccept: true,
          resultString: "Awaiting accept",
        });
        return;
      }
      if (
        receipt.status_text !== "Received" &&
        receipt.status_text !== "Completed" &&
        receipt.status_text !== "Sent"
      ) {
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: `Payment status is "${receipt.status_text}"`,
        });
        return;
      }
      if (!receipt.notes) {
        debug("No note");
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: "No note",
        });
        return;
      }
      if (
        receipt.notes.toUpperCase().trim() !==
        order.shortId?.toUpperCase().trim()
      ) {
        debug("Note mismatch", receipt.notes, order.shortId);
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: "Note mismatch. Please contact support.",
        });
        return;
      }
      const details = receipt?.header_subtext;
      if (!details) {
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: "Unable to resolve details",
        });
        return;
      }
      debug("Details", details);
      const cashTag = await getSetting("cashTag", "");
      if (cashTag) {
        // details should be "Payment to $cashTag"
        const match = details.match(
          new RegExp(`Payment to \\$${cashTag}$`, "i")
        );
        if (!match) {
          resolve({
            success: false,
            awaitingAccept: false,
            resultString: "Unable to resolve cash tag",
          });
          return;
        }
      }
      let receiptAmount = receipt?.amount_formatted;
      if (!receiptAmount) {
        for (const row of receipt?.detail_rows || []) {
          if (row.label === "Amount") {
            receiptAmount = row.value;
            break;
          }
        }
      }
      if (!receiptAmount) {
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: "Unable to resolve paid amount",
        });
        return;
      }
      const amount = parseFloat(receiptAmount.replace("$", ""));
      if (amount !== order.totalPrice) {
        resolve({
          success: false,
          awaitingAccept: false,
          resultString: "Amount mismatch. Please contact support.",
        });
        return;
      }
      resolve({
        success: true,
        awaitingAccept: false,
        resultString: "Payment received",
      });
    });
  }

  private async init() {
    await this.imapConnection?.connect();
  }

  private openInbox(
    callback: (err: Error | null, imap: Connection.Box | null) => void
  ) {
    if (this.imapConnection?.state === "authenticated") {
      this.imapConnection?.openBox("INBOX", false, callback);
    } else {
      this.imapConnection?.destroy();
      this.imapConnection?.once("close", async () => {
        debug(`Re-authenticating imap`);
        await this.init();
      });
    }
  }
}
