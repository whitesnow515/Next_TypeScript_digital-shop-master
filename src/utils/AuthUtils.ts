import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";

import { getAuthOptions } from "@api/auth/[...nextauth]";
import { UserSession } from "@app-types/models/user";
import { log } from "@util/log";

import { adminRolesNames, Role } from "./Roles";
import getUserModel from "../models/user";

const debug = process.env.DEBUG_ROLES === "true";

export function hasRole(
  userRoles: string[], // roles of the user
  requiredRoles_1: string[] | Role[]
) {
  if (!requiredRoles_1 || requiredRoles_1.length === 0) return true;
  if (!userRoles) return false;
  let requiredRoles: string[];
  if (requiredRoles_1[0] instanceof Role) {
    requiredRoles = (requiredRoles_1 as Role[]).map((r: Role) => r.name);
  } else {
    requiredRoles = requiredRoles_1 as string[];
  }
  return (
    userRoles.some((role: string) => {
      const b = requiredRoles.includes(role.toLowerCase());
      if (debug && b) {
        log("[DEBUG] - Role", role, "matches", requiredRoles, "for route.");
      }
      return b;
    }) ||
    adminRolesNames.some((role: string) => {
      const b = userRoles.includes(role);
      if (debug && b) {
        log("[DEBUG] - (SA) Role", role, "matches", userRoles, "for route.");
      }
      return b;
    })
  );
}

export async function requireLoggedInSSP(
    req: NextApiRequest,
    res: NextApiResponse,
    roles: string[] | Role[] = [],
    checkDB = true
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const session: any = !token
      ? await getServerSession(req, res, getAuthOptions())
      : null; // if token is null, we use session
  // log("token", token);
  if (!token && !session) {
    res.status(401).json({ success: false, message: "Not logged in" });
    return false;
  }
  let dbUser: any = null;

  if (roles.length > 0) {
    const user: any = token || (session && session.user); // prefer token over session
    if (!user) {
      return false;
    }
    let userRoles = user.roles;
    if (!checkDB && !userRoles && session && !token) {
      // we don't check the db for roles, roles don't exist, we are using session and token is null
      // thanks next-auth, all I want to do is to read a damn cookie on the client...
      return false;
    }
    if (checkDB) {
      const UserModel = await getUserModel();
      dbUser = await UserModel.findOne({
        email: user.email,
        username: user.username,
      }).exec();
      if (!dbUser) {
        return false;
      }
      if (dbUser.banned) {
        res.status(403).json({ success: false, message: "User is banned." });
      }
      userRoles = dbUser.roles;
    }
    if (userRoles.length ===0) {
      return false;
    }
    for (var userrole of userRoles) {
      if (roles.includes(userrole)) {
        return { token, user: dbUser };
      }
    }
  }
  return { token, user: dbUser };
}

export default async function requireLoggedIn(
  req: NextApiRequest,
  res: NextApiResponse,
  roles: string[] | Role[] = [],
  checkDB = true
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const session: any = !token
    ? await getServerSession(req, res, getAuthOptions())
    : null; // if token is null, we use session
  // log("token", token);
  if (!token && !session) {
    res.status(401).json({ success: false, message: "Not logged in" });
    return null;
  }
  let dbUser: any = null;
  if (roles.length > 0) {
    const user: any = token || (session && session.user); // prefer token over session
    if (!user) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return null;
    }
    let userRoles = user.roles;
    if (!checkDB && !userRoles && session && !token) {
      // we don't check the db for roles, roles don't exist, we are using session and token is null
      // thanks next-auth, all I want to do is to read a damn cookie on the client...
      res.status(401).json({
        success: false,
        message:
          "Cannot use checkDB = false and sessions together. Check @util/AuthUtils.ts for more info.",
      });
    }
    if (checkDB) {
      const UserModel = await getUserModel();
      dbUser = await UserModel.findOne({
        email: user.email,
        username: user.username,
      }).exec();
      if (!dbUser) {
        res
          .status(401)
          .json({ success: false, message: "User not found in DB." });
        return null;
      }
      if (dbUser.banned) {
        res.status(403).json({ success: false, message: "User is banned." });
      }
      userRoles = dbUser.roles;
    }
    if (!hasRole(userRoles, roles)) {
      res.status(403).json({
        success: false,
        message: "This page could not be found.",
      });
      return null;
    }
  }
  return { token, user: dbUser };
}

export async function getCurrentUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<any | null> {
  // do the same as requireLoggedIn but without the roles check, and if the user is not found, return null
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const session: any = !token
    ? await getServerSession(req, res, getAuthOptions())
    : null; // if token is null, we use session
  // log("token", token);
  if (!token && !session) {
    return null;
  }
  const user: any = token || (session && session.user); // prefer token over session
  if (!user) {
    return null;
  }
  const UserModel = await getUserModel();
  return UserModel.findOne({
    email: user.email,
    username: user.username,
  }).exec();
}

export async function getAppSession(): Promise<UserSession> {
  const a = await getServerSession({
    callbacks: { session: ({ token }) => token },
  });
  return a as UserSession;
}
