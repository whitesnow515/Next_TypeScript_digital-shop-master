import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { toJwtObject } from "@app-types/models/user";
import { saveMetric } from "@models/metrics";
import getUserModel from "@models/user";
import { signinMetricName } from "@src/types/metrics/SigninMetrics";
import { verify } from "@util/CaptchaUtils";
import { log } from "@util/log";
import { withRateLimitCfg } from "@util/RateLimit";
import escapeRegExp from "@util/regex";
import { getIp } from "@util/ServerUtils";
import speakeasy from "speakeasy";

export function nextAuth(
  req: NextApiRequest | null,
  res: NextApiResponse | null
) {
  const options: AuthOptions = {
    pages: {
      signIn: "/auth/signin",
      signOut: "/auth/signout",
      error: "/auth/signin", // Error code passed in query string as ?error=
      verifyRequest: "/auth/verify-request", // (used for check email message)
      // newUser: "/auth/new-user", // If set, new users will be directed here on first sign in
    },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        id: "credentials",
        credentials: {
          email: {
            label: "Email",
            type: "email",
            placeholder: "myass@owns-a.monster",
          },
          password: {
            label: "Password",
            type: "password",
            placeholder: "Nuts",
          },
        },
        async authorize(credentials: any) {
          if (!credentials) return null;

          if (process.env.USE_CAPTCHA === "true") {
            const captchaResponse = credentials["cf-turnstile-response"];
            if (!captchaResponse) {
              throw new Error("Please complete the captcha");
            }
            const captchaSecret = process.env.CAPTCHA_SECRET_KEY;
            if (!captchaSecret) {
              throw new Error("HCaptcha secret key not set");
            }
            const captchaVerification = await verify(
              captchaSecret,
              captchaResponse,
              getIp(req)
            );
            if (!captchaVerification.data.success) {
              throw new Error("Captcha verification failed");
            }
            // log("captchaVerification", captchaVerification);
          }

          const UserModel = await getUserModel();
          // Add logic here to look up the user from the credentials supplied
          const user:any = await UserModel.findOne({
            email: {
              $regex: new RegExp(`^${escapeRegExp(credentials.email)}$`, "i"),
            },
          }).exec();
          if (user) {
            if (user.banned) {
              throw new Error("User is banned");
            }
            // log("user:", user);
            const pass = await compare(
              credentials.password,
              // @ts-ignore - password exists
              user.password
            ).catch((e: any) => {
              // error("Error comparing passwords", e);
              throw new Error(e);
            });

            // if (!pass) return null;

            if (user.twofactor_verified){
              if (!credentials.code) {
                throw new Error("OTP Code")
              }
              const { base32: secret } = user.twofactor_secret;
              const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: credentials.code
              });
              if (!verified) {
                throw new Error("Invalid OTP code")
              }
            }

            log("Successfully logged in");
            await saveMetric(
              {
                userId: user._id,
              },
              signinMetricName
            );
            return toJwtObject(user);
          }
          throw new Error("User not found");
        },
      }),
      CredentialsProvider({
        id: "update-user",
        credentials: {},
        async authorize(credentials: any) {
          const { refreshToken } = credentials;
          if (!refreshToken) throw new Error("Token not provided.");
          const decoded: any = jwt.verify(
            refreshToken,
            `${process.env.NEXTAUTH_SECRET}`
          );
          if (decoded.use === "refresh") {
            const UserModel = await getUserModel();
            const user = await UserModel.findOne({
              _id: decoded.id,
              username: decoded.username,
              email: decoded.email,
              password:decoded.password
            }).exec();
            if (user) {
              return toJwtObject(user);
            }
            throw new Error("User not found");
          }
          // decode token
          /*
          const UserModel = await getUserModel();
          const user = await UserModel.findOne({
            id: credentials.id,
            email: credentials.email,
            username: credentials.username,
          }).exec();
          if (user) {
            log("found user:", user);
            return toJwtObject(user);
          }
           */
          throw new Error("User not found");
        },
      }),
    ],
    session: {
      strategy: "jwt",
      maxAge: 24 * 60 * 60, // 24 hours
    },
    jwt: {
      maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
      // @ts-ignore
      jwt: async ({ token, user }) => {
        const a = { ...token, ...user };
        // log("(1) jwt", a);
        return a;
      },
      session: async ({ session, token }) => {
        return { ...session, ...token };
      },
      redirect: async ({ baseUrl, url }) => {
        // this function checks for an invalid callback url (e.g. /auth/signout/), and redirects to the base url if it matches
        // it would be really annoying if you signed in, and then got immediately signed out
        const path = url.substring(baseUrl.length);
        // log("redirect", url, baseUrl, path);
        const blacklistedUrls = ["/auth/signin/", "/auth/signout/"];
        if (blacklistedUrls.includes(path)) {
          // log("redirecting to /");
          return baseUrl;
        }
        return url;
      },
    },
    /*
    cookies: {
      sessionToken: {
        name: "next-auth.session-token",
        options: {
          httpOnly: true,
        },
      },
    },
     */
    secret: process.env.NEXTAUTH_SECRET,
    theme: {
      colorScheme: "dark",
    },
    debug: false,
  };
  if (req && res) {
    return NextAuth(req, res, options);
  }
  return NextAuth(options);
}

export function getAuthOptions(): AuthOptions {
  return nextAuth(null, null).authOptions;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return nextAuth(req, res);
}

export default withRateLimitCfg(handler, {
  max: 10,
  window: 5,
  timeUnit: "minute",
  affectedRoutes: [
    {
      route: "/api/auth/callback/credentials/",
      failCallback: (req: NextApiRequest, res: NextApiResponse) => {
        res.redirect(
          "/auth/signin?error=Please%20wait%20a%20bit%20before%20trying%20again."
        );
      },
    },
  ],
});
