import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1800; // 30 minutes

const BASE_URL =
  process.env.SPACE_TRACK_BASE_URL ?? "https://www.space-track.org";

async function loginToSpaceTrack() {
  const identity = process.env.SPACE_TRACK_USERNAME;
  const password = process.env.SPACE_TRACK_PASSWORD;

  if (!identity || !password) {
    throw new Error("Missing Space-Track credentials");
  }

  const form = new URLSearchParams();
  form.set("identity", identity);
  form.set("password", password);

  const loginResponse = await fetch(`${BASE_URL}/ajaxauth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!loginResponse.ok) {
    throw new Error(`Space-Track login failed: ${loginResponse.status}`);
  }

  const cookie = loginResponse.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("No Space-Track session cookie returned");
  }

  return cookie;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "200");

    const cookie = await loginToSpaceTrack();

    const queryPath = [
  "basicspacedata/query",
  "class/gp",
  "EPOCH/>now-7",
  "decay_date/null-val",
  "orderby/EPOCH desc",
  `limit/${limit}`,
  "format/json",
].join("/");

    const upstream = await fetch(`${BASE_URL}/${queryPath}`, {
  headers: { cookie },
  next: { revalidate: 1800 }, 
});

    if (!upstream.ok) {
      throw new Error(`Space-Track query failed: ${upstream.status}`);
    }

    const rows = await upstream.json();
    return NextResponse.json({ items: rows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}