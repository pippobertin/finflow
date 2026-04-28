"use client";

import { Navbar } from "@/components/dashboard/navbar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar title="Impostazioni" />
      {children}
    </>
  );
}
