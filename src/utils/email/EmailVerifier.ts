import axios from "axios";

import getAllowedEmailsModel from "@models/allowed-emails";
import { getSetting } from "@util/SettingsHelper";

export type EmailVerificationResponse = {
  valid: boolean;
  error: boolean;
  invalid: boolean;
  message: string;
};
export type VerifyEmailResult = {
  success: boolean;
  message?: string;
};
export default async function verifyEmailValidity(
  email: string
): Promise<VerifyEmailResult> {
  const backendUrl = await getSetting("emailVerificationApiUrl", "");
  if (!backendUrl || typeof backendUrl !== "string") {
    return {
      success: true,
      message: "Email verification is disabled",
    };
  }
  const AllowedEmailModel = await getAllowedEmailsModel();
  const exempt = await AllowedEmailModel.findOne({
    email: email.toLowerCase(),
  });
  if (exempt) {
    return {
      success: true,
      message: "Email is exempt from verification",
    };
  }
  try {
    const res = await axios.post<EmailVerificationResponse>(backendUrl, {
      email,
    });
    if (res.data.error || res.data.invalid) {
      return {
        success: false,
        message: res.data.message,
      };
    }
    const data = new AllowedEmailModel({
      email,
      addedByName: "System",
    });
    await data.save();
    return {
      success: true,
      message: res.data.message,
    };
  } catch (e: any) {
    const message =
      e.response?.data?.message ||
      "An unknown error occurred while verifying email validity";
    return {
      success: false,
      message,
    };
  }
}
