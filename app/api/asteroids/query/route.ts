import { NextResponse } from "next/server";

export const revalidate = 1800;

const SBDB_BASE = "https://ssd-api.jpl.nasa.gov/sbdb_query.api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "100");

    const url = new URL(SBDB_BASE);

    url.searchParams.set(
      "fields",
      "full_name,spkid,neo,pha,H,diameter,albedo,moid"
    );

    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`SBDB fetch failed: ${res.status}`);
    }

    const data = await res.json();

    // 🔴 SAFETY CHECK (this avoids 500 crashes)
    if (!data.fields || !data.data) {
      throw new Error("SBDB response missing fields/data");
    }

    const fields = data.fields;
    const rows = data.data;

    const items = rows.map((row: any[]) => {
      const obj: any = {};
      fields.forEach((f: string, i: number) => {
        obj[f] = row[i];
      });

    return {
  id: obj.spkid,
  name: obj.full_name,
  hazardous: obj.pha === "Y",
  neo: obj.neo === "Y",
  absolute_magnitude: obj.H,
  diameter_km: obj.diameter,
  albedo: obj.albedo,
  moid_au: obj.moid,
};
    });

    return NextResponse.json({ items });

  } catch (err: any) {
    console.error("SBDB ERROR:", err); // 👈 IMPORTANT for debugging
    return NextResponse.json(
      { error: err.message || "SBDB proxy error" },
      { status: 500 }
    );
  }
}