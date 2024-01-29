import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import socks from "socks";

import { error } from "@util/log";
import { getSetting } from "@util/SettingsHelper";

import EmailSender from "../EmailSender";

async function sendMail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    let testAccount;
    if (process.env.EMAIL_TESTING === "true") {
      testAccount = await nodemailer.createTestAccount();
    }
    const smtpProxies = await getSetting("smtp_proxies", "");
    let proxy;
    if (smtpProxies) {
      const proxyList = smtpProxies.split("\n");
      proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    }
    const transport: SMTPTransport | SMTPTransport.Options = {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: testAccount ? testAccount.user : process.env.EMAIL_SERVER_USER,
        pass: testAccount
          ? testAccount.pass
          : process.env.EMAIL_SERVER_PASSWORD,
      },
    };
    if (proxy) {
      // @ts-ignore - https://nodemailer.com/smtp/proxies/
      transport.proxy = proxy;
    }
    const transporter = nodemailer.createTransport(transport);
    if (proxy && proxy.contains("socks")) {
      transporter.set("proxy_socks_module", socks);
    }
    const mailOptions: Mail.Options = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };
    if (text && text.length > 0) {
      mailOptions.text = text;
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (e) {
    error(e);
    return false;
  }
}

class NodemailerEmailSender implements EmailSender {
  sendEmailHtmlOnly(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    return sendMail(to, subject, html, "");
  }

  sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    return sendMail(to, subject, html, text);
  }
}

const nodeMailerEmailSender = new NodemailerEmailSender();
export default nodeMailerEmailSender;
