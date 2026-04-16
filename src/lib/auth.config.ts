import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth config shared between middleware (Edge) and full auth (Node).
 * No Prisma imports here — safe for Edge Runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // Credentials authorize runs only in Node runtime (not Edge middleware)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null, // overridden in full auth.ts
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicRoutes = ["/", "/login", "/register", "/api/auth"];
      const isPublic = publicRoutes.some(
        (route) =>
          nextUrl.pathname === route ||
          nextUrl.pathname.startsWith(route + "/")
      );

      if (isPublic) return true;
      if (isLoggedIn) return true;

      return false; // redirect to login
    },
  },
  session: { strategy: "jwt" },
};
