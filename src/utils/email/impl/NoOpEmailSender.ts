import EmailSender from "../EmailSender";

class NoOpEmailSender implements EmailSender {
  sendEmail(): Promise<boolean> {
    return Promise.resolve(true);
  }

  sendEmailHtmlOnly(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

const noOpEmailSender = new NoOpEmailSender();
export default noOpEmailSender;
