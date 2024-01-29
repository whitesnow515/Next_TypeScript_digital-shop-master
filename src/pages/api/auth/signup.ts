import { hash } from "bcryptjs";
import { NextApiRequest, NextApiResponse } from "next";

import { saveMetric } from "@models/metrics";
import getUserModel from "@models/user";
import blockedUsernames from "@root/disallowed_names.json";
import { signupMetricName } from "@src/types/metrics/SignupMetrics";
import withCaptcha from "@util/CaptchaUtils";
import { emailRegex } from "@util/commons";
import verifyEmailValidity from "@util/email/EmailVerifier";
import { error, log } from "@util/log";
import withRateLimit from "@util/RateLimit";
import { Role } from "@util/Roles";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST method is accepted
  if (req.method === "POST") {
    try {
      // Getting email and password from body
      const { username, email, password } = req.body;
      // Validate
      if (!email || !emailRegex.test(email) || !password) {
        res.status(422).json({ error: true, message: "Invalid Email" });
        return;
      }
      if (!password || password.trim().length < 7) {
        res.status(422).json({
          error: true,
          success: false,
          message: "Invalid Password. Length must be longer than 7 characters.",
        });
        return;
      }
      const max = 64;
      const min = 4;
      if (
        !username ||
        username.includes(" ") ||
        username.length > max ||
        username.length < min
      ) {
        res.status(422).json({
          error: true,
          success: false,
          message: `Invalid Username. Length must be between ${min} and ${max} characters, and cannot contain spaces.`,
        });
        return;
      }
      const lowerUser = username.toLowerCase();
      // validate username isn't blocked
      if (blockedUsernames) {
        const regexString = blockedUsernames.regex;
        const match = regexString && new RegExp(regexString).test(lowerUser);
        if (match || blockedUsernames.names.includes(lowerUser)) {
          res.status(422).json({
            error: true,
            success: false,
            message: "Invalid Username. This username is not allowed.",
          });
          return;
        }
      }
      log("Creating user...", username);
      // Connect with database
      const UserModel = await getUserModel();
      const lowerEmail = email.toLowerCase();
      const valid = await verifyEmailValidity(lowerEmail);
      if (!valid.success) {
        res.status(422).json({
          error: true,
          success: false,
          message: valid.message,
        });
        return;
      }
      // Check existing
      const checkExistingEmail = await UserModel.findOne({ email: lowerEmail });
      // Send error response if duplicate user is found
      if (checkExistingEmail) {
        res.status(422).json({
          error: true,
          success: false,
          message: "Email already registered!",
        });
        return;
      }
      const checkExistingUsername = await UserModel.findOne({
        lowercaseUsername: lowerUser,
      });
      // Send error response if duplicate user is found
      if (checkExistingUsername) {
        res.status(422).json({
          error: true,
          success: false,
          message: "Username already registered!",
        });
        return;
      }
      // create new user and hash password
      const user = new UserModel({
        username,
        lowercaseUsername: username.toLowerCase(),
        email: lowerEmail,
        password: await hash(password, 12),
        roles: [Role.USER.name],
      });
      await user.save();

      await saveMetric(
        {
          userId: user._id,
          username,
        },
        signupMetricName
      );

      const useEmail = process.env.USE_EMAIL === "true";
      if (useEmail) {
        log("Sending email verification...");
        try {
          // @ts-ignore - sendEmailVerification exists
          await user.sendEmailVerification();
          log("Email verification sent!");
        } catch (e) {
          // error(e);
          // res.status(500).json({
          //   error: true,
          //   success: false,
          //   message: "Could not send email verification!",
          // });
          // return;
        }
      } else {
        user.emailVerified = new Date();
      }

      // Send success response
      // eslint-disable-next-line no-underscore-dangle
      res.status(201).json({
        error: false,
        success: true,
        message: `Successfully created account!${
          useEmail ? " Please check your email to confirm your account." : ""
        }`,
      });
    } catch (e) {
      error(e);
      res.status(500).json({
        error: true,
        success: false,
        message: "Internal Server Error!",
      });
    }
  } else {
    // Response for other than POST method
    res
      .status(400)
      .json({ error: true, success: false, message: "Invalid Route" });
  }
}

export default withCaptcha(withRateLimit(handler, 5, 60));
