import { Resend } from "resend";

import EmailSender from "@util/email/EmailSender";

let resend: Resend | null = null;

class ResendEmailSender implements EmailSender {
  getResend(): Resend {
    if (!resend) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
  }

  sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        await this.getResend().sendEmail({
          from: process.env.EMAIL_FROM || "example@example.com",
          to,
          subject,
          html,
          text,
        });
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  }

  sendEmailHtmlOnly(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        await this.getResend().sendEmail({
          from: process.env.EMAIL_FROM || "example@example.com",
          to,
          subject,
          html,
        });
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  }
}

const resendEmailSender = new ResendEmailSender();
export default resendEmailSender;
