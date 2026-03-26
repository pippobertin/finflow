"use client";

import { useSession } from "next-auth/react";
import { CostCenterSelector } from "./cost-center-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { data: session } = useSession();
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <header className="glass border-border/50 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        <CostCenterSelector />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="focus:ring-ring flex items-center gap-2 rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none" />
            }
          >
            <Avatar className="h-8 w-8 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="shadow-card">
            <DropdownMenuItem disabled className="text-muted-foreground text-xs">
              {session?.user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
