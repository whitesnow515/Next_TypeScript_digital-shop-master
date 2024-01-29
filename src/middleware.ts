import { NextRequest, NextResponse } from "next/server";

import { handleStuff } from "./middleware/access-checker";

export default async function middleware(
  req: NextRequest
  // eslint-disable-next-line unused-imports/no-unused-vars
  // res: NextResponse
) {

  const r = await handleStuff(req);
  if (r) return r;
  // if we are on /assets/images, set cache header
  if (req.nextUrl.pathname.startsWith("/assets/images")) {
    return NextResponse.next({
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }
  return NextResponse.next();
}
