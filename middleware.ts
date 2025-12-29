// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
    const isPublicApi = req.nextUrl.pathname.startsWith("/api/public");

    // Allow auth API routes
    if (isApiAuth) {
      return NextResponse.next();
    }

    // Allow public API routes
    if (isPublicApi) {
      return NextResponse.next();
    }

    // Redirect authenticated users away from login
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow login page for unauthenticated users
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Protect all other routes
    if (!isAuth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Let middleware handle authorization
    },
  }
);

export const config = {
  matcher: [
    // Exclude static and image files from middleware
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
