import { render } from "@react-email/render";
import jwt from "jsonwebtoken";
import { Model, Schema } from "mongoose";

import { UserInterface } from "@app-types/models/user";
import ConfirmEmail from "@emails/ConfirmEmail";
import ForgotPassword from "@emails/ForgotPassword";
import dbConnect from "@lib/mongoose";
import banSchema from "@models/ban";
import { AppConfig } from "@util/AppConfig";
import { getBaseUrl } from "@util/ServerUtils";

import getEmailSender from "../utils/email/EmailManager";

const userSchema = new Schema<UserInterface & {twofactor_secret: any, twofactor_verified: boolean}>({
  username: { type: String, unique: true },
  lowercaseUsername: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  emailVerified: { type: Date },
  image: { type: String },
  roles: { type: [String], default: [] },
  showSupportButton: { type: Boolean, default: false },
  banned: { type: banSchema, default: null },
  note: { type: String, default: "" },
    twofactor_secret: {type: Schema.Types.Mixed},
    twofactor_verified: {type: Boolean},
  balance: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
});

// userSchema.methods.toJwtObject = ;
userSchema.methods.sendEmailVerification =
  async function sendEmailVerification() {
    const id = this._id;
    const { email, username } = this;
    const token = jwt.sign(
      { id, email, use: "verify_new" },
      `${process.env.NEXTAUTH_SECRET}`,
      {
        expiresIn: "12h",
      }
    );
    const verifyLink = `${getBaseUrl()}/auth/verify/email/${token}`;
    const htmlEmail = ConfirmEmail({
      username,
      verifyLink,
      title: AppConfig.title,
    });

    const html = render(htmlEmail);
    // Send email
    return getEmailSender().sendEmail(
      email,
      "Confirm your email address",
      html,
      `Thanks for signing up to ${AppConfig.title}! Please confirm your email address by following the link: ${verifyLink}`
    );
  };

userSchema.methods.getImageUrl = async function getImageUrl() {
  if (this.image) {
    return `/api/assets/img/${this.image}`;
  }
  return "/assets/images/profile.png";
};

userSchema.methods.sendPasswordResetEmail =
  async function sendPasswordResetEmail() {
    const id = this._id;
    const { email, username } = this;
    const token = jwt.sign({ id, email }, `${process.env.NEXTAUTH_SECRET}`, {
      expiresIn: "12h",
    });
    const resetLink = `${getBaseUrl()}/auth/forgot/next/${token}`;
    const htmlEmail = ForgotPassword({ username, resetLink });

    const html = render(htmlEmail);
    // Send email
    await getEmailSender().sendEmail(
      email,
      "Reset password",
      html,
      `You have requested to reset your password. Please follow the link to reset your password: ${resetLink}`
    );
  };

// @ts-ignore
let cached = global.userModel;
if (!cached) {
  // @ts-ignore
  // eslint-disable-next-line no-multi-assign
  cached = global.userModel = { model: null, promise: null };
}
export default async function getUserModel(): Model<UserInterface> {
  if (cached.model) return cached.model;

  if (!cached.promise) {
    const mongoose = await dbConnect();
    cached.promise = mongoose.model("User", userSchema);
  }
  cached.model = await cached.promise;
  return cached.model;
}
export { userSchema };
