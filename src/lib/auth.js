import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    // Email + Password login
    CredentialsProvider({
      id: "login",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name || user.email?.split("@")[0] || "User",
          email: user.email,
          image: user.image || null,
          credits: user.credits,
          customApiKey: user.customApiKey,
          isApiKeyUser: false,
        };
      },
    }),
    // API Key login (for advanced users with their own MuAPI key)
    CredentialsProvider({
      id: "apikey",
      name: "API Key",
      credentials: {
        apiKey: { label: "MuAPI Key", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.apiKey) {
          throw new Error("API Key is required");
        }
        const apiKey = credentials.apiKey.trim();
        if (apiKey.length < 5) {
          throw new Error("Invalid API key format");
        }

        const dummyEmail = `apikey_${apiKey.slice(-8)}@muapi.local`;
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { customApiKey: apiKey },
              { email: dummyEmail }
            ]
          }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: "API Key User",
              email: dummyEmail,
              customApiKey: apiKey,
              credits: 0,
            }
          });
        } else if (!dbUser.customApiKey) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { customApiKey: apiKey }
          });
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || null,
          credits: dbUser.credits,
          customApiKey: dbUser.customApiKey || apiKey,
          isApiKeyUser: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.customApiKey = user.customApiKey;
        token.isApiKeyUser = user.isApiKeyUser || false;
      }
      if (trigger === "update" && session) {
        if (session.customApiKey !== undefined) token.customApiKey = session.customApiKey;
        if (session.credits !== undefined) token.credits = session.credits;
      }
      const userId = token.id || token.sub;
      if (userId) {
        token.id = userId;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, customApiKey: true }
          });
          if (dbUser) {
            token.credits = dbUser.credits;
            token.customApiKey = dbUser.customApiKey;
          }
        } catch (err) {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id || token.sub;
        session.user.credits = token.credits;
        session.user.customApiKey = token.customApiKey;
        session.user.isApiKeyUser = Boolean(token.customApiKey);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
