import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import protectedRoutes from "@root/access.config.json";
import { adminRolesNames } from "@util/Roles";

const compiledProtectedRoutes = protectedRoutes.map((route) => {
  return {
    ...route,
    regex: new RegExp(`^${route.path}`),
    rolesLower: route.roles.map((role) => role.toLowerCase()),
  };
});
// I'm not sure if this regex stuff is the best way to do this, performance-wise and practically, but it works.
const debug = process.env.DEBUG_ROLES === "true";

interface Header {
  key: string;
  value: string;
}

export function setHeaders(res: NextResponse, headers: Header[]): NextResponse {
  headers.forEach((header) => {
    res.headers.set(header.key, header.value);
  });
  return res;
}

export async function handleStuff(req: NextRequest) {
  // maybe we can use this https://next-auth.js.org/getting-started/client#custom-client-session-handling
  const headers: Header[] = [
    /* these are no longer needed
    {
      key: "Access-Control-Allow-Origin",
      value: `${process.env.NEXTAUTH_URL}`,
    },
    {
      key: "Access-Control-Allow-Credentials",
      value: "true", // so the client can read the cookie for protected API requests
    },
     */
  ];
  try {
    const { pathname } = req.nextUrl;
    const isAPIRequest = req.method === "POST" || req.url.startsWith("/api/");
    // if (debug) debugLog("Pathname", pathname);
    const match = compiledProtectedRoutes.find((route) => {
      const b = route.regex.test(pathname);
      if (debug && b) {
        // debugLog("Route", route.path, "matches", pathname, b);
      }
      return b;
    });
    if (match) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      // chalk is broken on middleware
      // if (debug) debugLog("Token", token);
      if (!token) {
        if (isAPIRequest) {
          return setHeaders(
            new NextResponse(
              JSON.stringify({
                success: false,
                message: "Authentication required on this route.",
              }),
              {
                status: 401,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            ),
            headers
          );
        }
        const url = new URL("/auth/signin", req.url);
        // if (debug) debugLog("Redirecting to", url);
        return setHeaders(NextResponse.rewrite(url), headers);
      }
      // @ts-ignore - token.roles exists
      const { roles }: string[] = token;
      // if (debug) debugLog("Token roles", roles);
      if (!roles) {
        if (isAPIRequest) {
          return setHeaders(
            new NextResponse(
              JSON.stringify({
                success: false,
                message:
                  "You do not have the required roles to access this route.",
              }),
              {
                status: 401,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            ),
            headers
          );
        }
        const url = new URL("/auth/signin", req.url);
        // if (debug)
        // debugLog("Redirecting to sign in because roles is undefined!");
        return setHeaders(NextResponse.rewrite(url), headers);
      }
      // for some reason, I can't use AuthUtils.hasRole here
      const hasRole =
        roles.some((role: string) => {
          const b = match.rolesLower.includes(role.toLowerCase());
          if (debug && b) {
            /*
            log(
              "[DEBUG] - Role",
              role,
              "matches",
              match.rolesLower,
              "for route",
              match.path
            );
             */
          }
          return b;
        }) ||
        adminRolesNames.some((role: string) => {
          const b = roles.includes(role);
          if (debug && b) {
            /*
            log(
              "[DEBUG] - Role",
              role,
              "matches",
              roles,
              "for route",
              match.path
            );
             */
          }
          return b;
        });
      if (!hasRole) {
        if (isAPIRequest) {
          return setHeaders(
            new NextResponse(
              JSON.stringify({
                success: false,
                message:
                  "You do not have the required roles to access this route.",
              }),
              {
                status: 403,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            ),
            headers
          );
        }
        const url = new URL("/403", req.url);
        if (debug) {
          /*
          log(
            "[DEBUG] - Redirecting to",
            url,
            "because user doesn't have a role that matches the route!"
          );
           */
        }
        return setHeaders(NextResponse.rewrite(url), headers);
      }
    }
  } catch (e) {
    // error(e);
  }
  return setHeaders(NextResponse.next(), headers);
}
