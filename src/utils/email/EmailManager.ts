import ResendEmailSender from "@util/email/impl/ResendEmailSender";

import EmailSender from "./EmailSender";
import NodemailerEmailSender from "./impl/NodemailerEmailSender";
import NoOpEmailSender from "./impl/NoOpEmailSender";
import RotatingNodemailerEmailSender from "./impl/RotatingNodemailerEmailSender";

function getEmailSender(): EmailSender {
  if (process.env.USE_RESEND === "true") {
    return ResendEmailSender;
  }
  if (process.env.USE_EMAIL === "true") {
    if (process.env.USE_ROTATING_EMAIL === "true") {
      return RotatingNodemailerEmailSender;
    }
    return NodemailerEmailSender;
  }
  return NoOpEmailSender;
}

export default getEmailSender;
