import { type UserRole, type UserType } from "@prisma/client";
import { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      organizationId: string;
      // V2 multi-tenant fields
      userType: UserType | null;
      accountingFirmId: string | null;
      clientGroupId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    organizationId: string;
    userType: UserType | null;
    accountingFirmId: string | null;
    clientGroupId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    organizationId: string;
    userType: UserType | null;
    accountingFirmId: string | null;
    clientGroupId: string | null;
  }
}
