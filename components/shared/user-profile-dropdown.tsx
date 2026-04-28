"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";

function userTypeLabel(userType?: string | null): string {
  switch (userType) {
    case "CONTROLLER":
      return "Controller";
    case "CLIENT_OWNER":
      return "Titolare";
    case "CLIENT_ADMIN_BANK_ONLY":
      return "Solo Movimenti";
    default:
      return "Utente";
  }
}

export function UserProfileDropdown() {
  const { data: session } = useSession();

  const name = session?.user?.name ?? "Utente";
  const email = session?.user?.email ?? "";
  const userType = session?.user?.userType;
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const isController = userType === "CONTROLLER";
  const settingsHref = isController ? "/firm/settings" : "/settings/account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" />
        }
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <p className="truncate text-sm leading-tight font-medium">{name}</p>
          <p className="text-muted-foreground truncate text-[10px] leading-tight">
            {userTypeLabel(userType)}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" sideOffset={8} align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="text-foreground text-sm font-medium">{name}</span>
            <span className="text-muted-foreground text-xs font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={settingsHref} />}>
          <Settings className="mr-2 h-4 w-4" />
          Impostazioni
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
