/**
 * Next.js 16 Proxy (ex middleware).
 *
 * All legacy feature-flag route gating has been removed (Fase 3 Block D).
 * This file is kept as a placeholder for future proxy needs.
 */
import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}
