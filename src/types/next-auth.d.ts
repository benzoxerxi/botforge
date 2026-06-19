import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      companyId: string;
      companyName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
  }
}
