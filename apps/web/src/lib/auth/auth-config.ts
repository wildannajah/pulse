import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import { encode as defaultEncode } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { bootstrapWorkspace } from "@/lib/auth/bootstrap-workspace";
import { PrismaAdapter } from "@/lib/auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Sliding refresh every 24h
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email;
        const password = credentials.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60, // 15 minutes
    }),
  ],
  jwt: {
    // Override encode: for Credentials sign-ins, create a database session
    // and return the session token as the "JWT". This makes Credentials work
    // with strategy: "database".
    async encode(params) {
      // When Auth.js calls encode during a Credentials sign-in,
      // params.token contains the user data from authorize().
      // We detect this by checking for the trigger flag set in signIn callback.
      if (params.token?.credentials === true) {
        const sessionToken = crypto.randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (adapter.createSession) {
          await adapter.createSession({
            sessionToken,
            userId: params.token.sub as string,
            expires,
          });
        }

        return sessionToken;
      }

      // For OAuth/Email providers, use default JWT encoding
      return defaultEncode(params);
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Flag Credentials sign-ins so jwt.encode can detect them
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        try {
          await bootstrapWorkspace(user.id);
        } catch {
          // Bootstrap failure should not block sign-in
          // Workspace will be created on next sign-in attempt
        }
      }
      return true;
    },
  },
});
