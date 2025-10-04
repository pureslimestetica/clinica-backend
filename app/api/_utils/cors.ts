// app/api/_utils/cors.ts
import { NextResponse } from "next/server";

const ALLOW = process.env.CORS_ALLOW_ORIGIN || "*";

export function withCors<T extends Response | NextResponse>(res: T): T {
  res.headers.set("Access-Control-Allow-Origin", ALLOW);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export function preflight() {
  return withCors(new NextResponse(null, { status: 204 }));
}
