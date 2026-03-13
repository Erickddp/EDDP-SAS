import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/chat"];
const authEntryRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/demo") {
    return NextResponse.redirect(new URL("/chat", request.nextUrl));
  }

  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthEntryRoute = authEntryRoutes.includes(path);

  const cookie = request.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isAuthEntryRoute && session) {
    return NextResponse.redirect(new URL("/chat", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
