import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

import { error, info } from "@util/log";
import { getSetting } from "@util/SettingsHelper";

import EmailSender from "../EmailSender";

interface SmtpServer {
  options: SMTPTransport.Options;
  from: string;
  proxy?: string;
}
function parseEscape(str: string): string {
  return str.replace("%col%", ":");
}
function stringToSmtpServer(server: string): SmtpServer {
  const parts = server.split(":");
  return {
    options: {
      auth: {
        user: parseEscape(parts[0] as string),
        pass: parseEscape(parts[1] as string),
      },
      host: parseEscape(parts[2] as string),
      port: Number(parts[3]),
      secure: parts[4] === "secure_true",
    },
    from: parseEscape(parts[5] as string),
  };
}
interface RandomSmtpServer {
  server: SmtpServer;
  proxy: string | undefined;
  otherServers: SmtpServer[];
}
async function getRandomSMTPServer(): Promise<RandomSmtpServer> {
  const allServers = await getSetting("smtp_credentials", "");
  const servers = allServers.split("\n");
  const s: string = servers[Math.floor(Math.random() * servers.length)];
  const server: SmtpServer = stringToSmtpServer(s);
  const otherServers = servers
    .filter((str: string) => str !== s)
    .map((str: string) => stringToSmtpServer(str));
  const smtpProxies = await getSetting("smtp_proxies", "");
  let proxy;
  if (smtpProxies) {
    const proxyList = smtpProxies.split("\n");
    proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
  }
  if (proxy) {
    // @ts-ignore - https://nodemailer.com/smtp/proxies/
    server.options.proxy = proxy;
  }
  return {
    server,
    proxy,
    otherServers,
  };
}
class RotatingNodemailerEmailSender implements EmailSender {
  async sendEmailHtmlOnly(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    return this.sendEmail(to, subject, html, "");
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    const stuff = await getRandomSMTPServer();
    let success = false;
    try {
      await this.sendEmailWithServer(to, subject, html, text, stuff.server);
      info("Email sent successfully");
      success = true;
    } catch (e) {
      error(
        `Failed to send email... Trying with another server (if it exists). Host: ${stuff.server.options.host} From: ${stuff.server.from}`,
        e
      );
      if (stuff.otherServers.length > 0) {
        for (const server of stuff.otherServers) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await this.sendEmailWithServer(to, subject, html, text, server);
            info("Email sent successfully");
            success = true;
            break;
          } catch (eX) {
            error(
              `Failed to send email... Trying with another server (if it exists). Host: ${server.options.host} From: ${server.from}`,
              eX
            );
          }
        }
      }
    }
    return success;
  }

  async sendEmailWithServer(
    to: string,
    subject: string,
    html: string,
    text: string,
    server: SmtpServer
  ): Promise<void> {
    const { options, from } = server;
    const transporter = nodemailer.createTransport(options);
    const mailOptions: Mail.Options = {
      from,
      to,
      subject,
      html,
    };
    if (text && text.length > 0) {
      mailOptions.text = text;
    }
    await transporter.sendMail(mailOptions);
  }
}

const rotatingNodemailerEmailSender = new RotatingNodemailerEmailSender();
export default rotatingNodemailerEmailSender;
