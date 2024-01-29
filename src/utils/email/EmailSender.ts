interface EmailSender {
  sendEmailHtmlOnly(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean>;

  sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean>;
}

export default EmailSender;
