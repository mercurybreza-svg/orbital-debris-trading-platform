"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Orbit,
  Radar,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";

type SpaceTrackItem = {
  NORAD_CAT_ID?: number | string;
  OBJECT_NAME?: string;
  OBJECT_TYPE?: string;
  APOGEE?: number | string;
  PERIGEE?: number | string;
  MEAN_MOTION?: number | string;
  RCS_SIZE?: string | null;
  DECAY_DATE?: string | null;
  LAUNCH_DATE?: string | null;
};
type DebrisAsset = {
  id: string;
  name: string;
  objectType: "DEBRIS" | "ROCKET BODY" | "PAYLOAD";
  orbit: "LEO" | "MEO" | "GEO";
  altitudeKm: number;
  rcs: "SMALL" | "MEDIUM" | "LARGE";
  riskScore: number;
  congestionScore: number;
  recoverabilityScore: number;
  historicalValueM: number;
  legacyPremiumM: number;
  holderValueM: number;
  fairValueM: number;
  spreadPct: number;
  status: "ACTIVE" | "WATCH" | "RESTRICTED";
  payloadState: "ACTIVE" | "NON_ACTIVE" | null;
  marketSegment: "ACTIVE_PAYLOAD" | "NON_ACTIVE_PAYLOAD" | "LEGACY_DEBRIS";
};

function toNumber(value: number | string | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRcs(value?: string | null): DebrisAsset["rcs"] {
  const rcs = (value ?? "SMALL").toUpperCase();
  if (rcs.includes("LARGE")) return "LARGE";
  if (rcs.includes("MEDIUM")) return "MEDIUM";
  return "SMALL";
}

function deriveOrbit(apogee: number, perigee: number): DebrisAsset["orbit"] {
  const altitude = Math.max(0, Math.round((apogee + perigee) / 2));
  if (altitude >= 30000) return "GEO";
  if (altitude >= 2000) return "MEO";
  return "LEO";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function deriveAltitudeKm(item: SpaceTrackItem): number {
  const apogee = toNumber(item.APOGEE);
  const perigee = toNumber(item.PERIGEE);

  if (apogee > 0 || perigee > 0) {
    return Math.max(0, Math.round((apogee + perigee) / 2));
  }

  const meanMotion = toNumber(item.MEAN_MOTION);
  if (meanMotion > 0) {
    const mu = 398600.4418; // km^3/s^2
    const earthRadiusKm = 6378.137;
    const n = (meanMotion * 2 * Math.PI) / 86400; // rad/s
    const semiMajorAxis = Math.cbrt(mu / (n * n));
    return Math.max(0, Math.round(semiMajorAxis - earthRadiusKm));
  }

  return 0;
}

function yearsSince(date?: string | null): number {
  if (!date) return 0;
  const then = new Date(date);
  const now = new Date();
  const ms = now.getTime() - then.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
}
function mapObjectType(value?: string): DebrisAsset["objectType"] {
  const objectType = (value ?? "DEBRIS").toUpperCase();
  if (objectType.includes("ROCKET")) return "ROCKET BODY";
  if (objectType.includes("PAYLOAD")) return "PAYLOAD";
  return "DEBRIS";
}
function mapToAsset(item: SpaceTrackItem): DebrisAsset {
  const apogee = toNumber(item.APOGEE);
  const perigee = toNumber(item.PERIGEE);
  const altitudeKm = deriveAltitudeKm(item);
  const orbit = deriveOrbit(
    apogee > 0 ? apogee : altitudeKm,
    perigee > 0 ? perigee : altitudeKm
  );

  const rcs = normalizeRcs(item.RCS_SIZE);
  const objectType = mapObjectType(item.OBJECT_TYPE);

  const rcsWeight = rcs === "LARGE" ? 24 : rcs === "MEDIUM" ? 14 : 8;
  const orbitWeight = orbit === "LEO" ? 24 : orbit === "MEO" ? 12 : 6;
  const objectWeight =
    objectType === "DEBRIS" ? 20 : objectType === "ROCKET BODY" ? 16 : 9;

  const riskScore = clamp(
    38 + rcsWeight + orbitWeight + (altitudeKm < 1200 ? 10 : 0),
    35,
    96
  );

  const congestionScore = clamp(
    35 + orbitWeight + (orbit === "LEO" ? 26 : 8),
    25,
    98
  );

  const recoverabilityScore = clamp(
    82 -
      (orbit === "GEO" ? 42 : orbit === "MEO" ? 24 : 0) +
      (rcs === "LARGE" ? 10 : 0),
    18,
    92
  );

  let status: DebrisAsset["status"] = "ACTIVE";
  if (orbit === "GEO") status = "RESTRICTED";
  else if (recoverabilityScore < 45 || objectType === "ROCKET BODY") status = "WATCH";

const ageYears = yearsSince(item.LAUNCH_DATE);

let payloadState: "ACTIVE" | "NON_ACTIVE" | null = null;

if (objectType === "PAYLOAD") {
  payloadState =
    ageYears >= 4 ||
    recoverabilityScore < 80 ||
    orbit !== "LEO" ||
    status !== "ACTIVE"
      ? "NON_ACTIVE"
      : "ACTIVE";
}

let marketSegment: "ACTIVE_PAYLOAD" | "NON_ACTIVE_PAYLOAD" | "LEGACY_DEBRIS" =
  "ACTIVE_PAYLOAD";

if (objectType === "PAYLOAD") {
  if (orbit === "MEO") {
    marketSegment = "ACTIVE_PAYLOAD";
  } else if (ageYears >= 10 || orbit === "GEO") {
    marketSegment = "LEGACY_DEBRIS";
  } else if (ageYears >= 4 || recoverabilityScore < 75) {
    marketSegment = "NON_ACTIVE_PAYLOAD";
  } else {
    marketSegment = "ACTIVE_PAYLOAD";
  }
} else {
  marketSegment = "LEGACY_DEBRIS";
}
const basePhysicalValue =
  1.1 +
  (rcs === "LARGE" ? 2.2 : rcs === "MEDIUM" ? 1.2 : 0.5) +
  (objectType === "PAYLOAD" ? 1.4 : objectType === "ROCKET BODY" ? 1.0 : 0.7) +
  (orbit === "LEO" ? 0.8 : orbit === "MEO" ? 0.6 : 0.4);

const missionHeritageValue =
  Math.min(ageYears * 0.08, 1.8) +
  (objectType === "PAYLOAD" ? 0.8 : 0.3);

const historicalValueM = Number(
  (basePhysicalValue + missionHeritageValue).toFixed(1)
);
let legacyPremiumM = 0;
let fairValueM = historicalValueM;

if (marketSegment === "ACTIVE_PAYLOAD") {
  fairValueM = Number(
    (
      historicalValueM +
      recoverabilityScore * 0.035 +
      congestionScore * 0.018 +
      (orbit === "LEO" ? 0.9 : orbit === "MEO" ? 0.5 : 0.2)
    ).toFixed(1)
  );
}

if (marketSegment === "NON_ACTIVE_PAYLOAD") {
  fairValueM = Number(
    (
      historicalValueM +
      recoverabilityScore * 0.02 +
      congestionScore * 0.015 +
      (orbit !== "LEO" ? 0.5 : 0.2) -
      1.2
    ).toFixed(1)
  );
}

if (marketSegment === "LEGACY_DEBRIS") {
  legacyPremiumM = Number(
    (
      congestionScore * 0.03 +
      riskScore * 0.028 +
      (orbit === "LEO" ? 1.5 : orbit === "MEO" ? 0.9 : 0.6) +
      Math.min(ageYears * 0.06, 2.5)
    ).toFixed(1)
  );

  fairValueM = Number((historicalValueM + legacyPremiumM).toFixed(1));
}

const spreadPct = Number(
  (
    2.5 +
    (100 - recoverabilityScore) * 0.035 +
    (marketSegment === "NON_ACTIVE_PAYLOAD" ? 0.8 : 0) +
    (marketSegment === "LEGACY_DEBRIS" ? 1.6 : 0)
  ).toFixed(1)
);

const holderValueM =
  marketSegment === "LEGACY_DEBRIS"
    ? Number((fairValueM + legacyPremiumM * 0.35).toFixed(1))
    : fairValueM;

return {
  id: String(item.NORAD_CAT_ID ?? "UNKNOWN"),
  name: item.OBJECT_NAME || "Unnamed Object",
  objectType,
  orbit,
  altitudeKm,
  rcs,
  riskScore,
  congestionScore,
  recoverabilityScore,
  historicalValueM,
  legacyPremiumM,
  holderValueM,
  fairValueM,
  spreadPct,
  status,
  payloadState,
  marketSegment,
};
}
function scoreTone(score: number) {
  if (score >= 85) return "text-red-300";
  if (score >= 70) return "text-amber-300";
  return "text-emerald-300";
}

function statusTone(status: DebrisAsset["status"]) {
  if (status === "ACTIVE") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "WATCH") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-red-500/40 bg-red-500/10 text-red-300";
}

function formatMoney(value: number) {
  return `$${value.toFixed(1)}M`;
}

function OrderBook({ fairValue }: { fairValue: number }) {
  const bids = [
    { px: fairValue - 0.4, qty: 14 },
    { px: fairValue - 0.7, qty: 22 },
    { px: fairValue - 1.1, qty: 31 },
  ];

  const asks = [
    { px: fairValue + 0.3, qty: 12 },
    { px: fairValue + 0.8, qty: 18 },
    { px: fairValue + 1.2, qty: 28 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-emerald-300">Bids</div>
          <ArrowUpRight className="h-4 w-4 text-emerald-300" />
        </div>
        <div className="space-y-2 text-sm">
          {bids.map((row) => (
            <div key={row.px} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
              <span className="text-white/70">{row.qty} tons</span>
              <span className="font-semibold text-white">{formatMoney(row.px)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-red-300">Asks</div>
          <ArrowDownRight className="h-4 w-4 text-red-300" />
        </div>
        <div className="space-y-2 text-sm">
          {asks.map((row) => (
            <div key={row.px} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
              <span className="text-white/70">{row.qty} tons</span>
              <span className="font-semibold text-white">{formatMoney(row.px)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 text-lg font-semibold text-white ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function segmentTitle(tab: "payloads" | "inactive" | "legacy") {
  if (tab === "legacy") return "Legacy Orbital Debris Market";
  if (tab === "inactive") return "Likely Non-Active Payload Market";
  return "Active Payload Market";
}

function segmentAccent(tab: "payloads" | "inactive" | "legacy") {
  if (tab === "legacy") {
    return {
      border: "border-amber-400/40",
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      subtle: "text-amber-200/70",
    };
  }

  if (tab === "inactive") {
    return {
      border: "border-cyan-400/40",
      bg: "bg-cyan-500/10",
      text: "text-cyan-300",
      subtle: "text-cyan-200/70",
    };
  }

  return {
    border: "border-green-400/40",
    bg: "bg-green-500/10",
    text: "text-green-300",
    subtle: "text-green-200/70",
  };
}
export default function Home() {
const [assets, setAssets] = useState<DebrisAsset[]>([]);
const [query, setQuery] = useState("");
const [selectedId, setSelectedId] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [tab, setTab] = useState<"payloads" | "inactive" | "legacy">("payloads");

const [showTradeModal, setShowTradeModal] = useState(false); 
const [showLawyerModal, setShowLawyerModal] = useState(false);
const theme = segmentAccent(tab);
const sectionTitle = segmentTitle(tab);

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/space-track/catalog?limit=10000");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load catalog");
        }

        const mapped = (Array.isArray(data.items) ? data.items : [])
.filter(
  (item: SpaceTrackItem) =>
    !item.DECAY_DATE &&
    ["PAYLOAD", "ROCKET BODY", "DEBRIS"].includes(
      (item.OBJECT_TYPE || "").toUpperCase()
    )
)
    .map(mapToAsset)
  .sort((a: DebrisAsset, b: DebrisAsset) => {
    const scoreA =
      a.fairValueM + a.congestionScore * 0.03 + a.recoverabilityScore * 0.02;
    const scoreB =
      b.fairValueM + b.congestionScore * 0.03 + b.recoverabilityScore * 0.02;
    return scoreB - scoreA;
  });

        setAssets(mapped);
        setSelectedId(mapped[0]?.id ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, []);
const filtered = useMemo(() => {
  let base = assets;

  if (tab === "payloads") {
  base = base.filter(
    (a) => a.marketSegment === "ACTIVE_PAYLOAD" && a.orbit === "LEO"
  );
}
if (tab === "inactive") {
  base = base.filter(
    (a) =>
      a.marketSegment === "ACTIVE_PAYLOAD" &&
      a.altitudeKm > 2000 &&
      a.altitudeKm < 35786
  );
}
  if (tab === "legacy") {
    base = base.filter((a) => a.marketSegment === "LEGACY_DEBRIS");
  }

  const q = query.toLowerCase().trim();

  return base.filter((asset) => {
    if (!q) return true;

    return [
      asset.name,
      asset.id,
      asset.objectType,
      asset.orbit,
      asset.status,
      asset.marketSegment,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}, [assets, query, tab]);

  const selected = filtered.find((asset) => asset.id === selectedId) ?? filtered[0] ?? assets[0] ?? null;

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 font-mono text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-500/20 bg-zinc-950 p-6 text-emerald-300">
          Loading live Space-Track debris market...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black p-6 font-mono text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-500/20 bg-zinc-950 p-6 text-red-300">
          Error loading live market: {error}
        </div>
      </main>
    );
  }

  if (!selected) {
    return (
      <main className="min-h-screen bg-black p-6 font-mono text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white/70">
          No active objects returned from Space-Track.
        </div>
      </main>
    );
  }

  const mark = selected.fairValueM * (1 + selected.spreadPct / 100 / 2);
  const edge = selected.fairValueM * (selected.recoverabilityScore / 100) - selected.fairValueM * 0.42;
  const activeCount = assets.filter((a) => a.status === "ACTIVE").length;
  const watchCount = assets.filter((a) => a.status === "WATCH").length;
  const median = assets[Math.floor(assets.length / 2)]?.fairValueM ?? 0;
  /* ✅ INSERT HERE */
const activePayloadCount = assets.filter(
  (a) => a.marketSegment === "ACTIVE_PAYLOAD" && a.orbit === "LEO"
).length;

const meoActivePayloadCount = assets.filter(
  (a) => a.marketSegment === "ACTIVE_PAYLOAD" && a.orbit === "MEO"
).length;

const legacyDebrisCount = assets.filter(
  (a) => a.marketSegment === "LEGACY_DEBRIS"
).length;
  return (
    <main className="min-h-screen bg-black p-5 font-mono text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
  <div className="mb-2 text-sm uppercase tracking-[0.25em] text-emerald-300">
    Live debris market
  </div>

  <h1 className="text-3xl font-semibold md:text-5xl">
    Orbital Debris Trading Platform
  </h1>

  <p className="mt-3 max-w-3xl text-white/65">
    Commodity-style trading UI for active orbital debris, now powered by live Space-Track objects filtered to exclude deorbited inventory.
  </p>

  {/* ✅ ADD TABS HERE */}
  <div className="mt-4 flex flex-wrap gap-3">
  <button
    onClick={() => setTab("payloads")}
    className={`px-4 py-2 rounded-lg border ${
      tab === "payloads"
        ? "bg-green-500 text-black border-green-400"
        : "border-white/20 text-white/60"
    }`}
  >
    Active Payloads ({activePayloadCount})
  </button>

  <button
    onClick={() => setTab("inactive")}
    className={`px-4 py-2 rounded-lg border ${
      tab === "inactive"
        ? "bg-cyan-500 text-black border-cyan-400"
        : "border-white/20 text-white/60"
    }`}
  >
  MEO Active Payloads ({meoActivePayloadCount})
  </button>

  <button
    onClick={() => setTab("legacy")}
    className={`px-4 py-2 rounded-lg border ${
      tab === "legacy"
        ? "bg-amber-500 text-black border-amber-400"
        : "border-white/20 text-white/60"
    }`}
  >
    Legacy Orbital Debris ({legacyDebrisCount})
  </button>
</div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Tradable" value={`${activeCount}`} />
            <Metric label="Watchlist" value={`${watchCount}`} />
            <Metric label="Median FV" value={formatMoney(median)} />
            <Metric label="Market Status" value="Open" tone="text-emerald-300" />
          <Metric label="Historical Value" value={formatMoney(selected.historicalValueM)} />
<Metric label="Legacy Premium" value={formatMoney(selected.legacyPremiumM)} />
<Metric label="Fair Value" value={formatMoney(selected.fairValueM)} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-3 py-3">
              <Search className="h-4 w-4 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search active debris"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div className="space-y-3 max-h-[75vh] overflow-auto pr-1">
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected.id === asset.id
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/50"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{asset.name}</div>
                      <div className="mt-1 text-xs text-white/45">{asset.id}</div>
                    </div>
                    <div className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(asset.status)}`}>
                      {asset.status}
                    </div>
                  </div>

                 <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
  <div>{asset.objectType}</div>
  <div>{asset.orbit}</div>
  <div>{asset.altitudeKm.toLocaleString()} km</div>
  <div>{formatMoney(asset.fairValueM)}</div>
  <div className="text-xs text-white/40">{asset.payloadState}</div>
</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-white/50">
                    <Orbit className="h-4 w-4" />
                    <span className="text-sm">{selected.id} · {selected.objectType}</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-white">{selected.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                    Live Space-Track object transformed into tradable commodity inventory using congestion, risk, RCS,
                    altitude, and recoverability-weighted fair value.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-right">
                  <div className="text-xs uppercase tracking-wide text-emerald-200/70">Mark</div>
                  <div className="mt-1 text-3xl font-semibold text-white">{formatMoney(mark)}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="Fair Value" value={formatMoney(selected.fairValueM)} />
                <Metric label="Spread" value={`${selected.spreadPct.toFixed(1)}%`} />
                <Metric label="Altitude" value={`${selected.altitudeKm.toLocaleString()} km`} />
                <Metric label="RCS" value={selected.rcs} />
                <Metric label="Risk Score" value={`${selected.riskScore}/100`} tone={scoreTone(selected.riskScore)} />
                <Metric label="Congestion" value={`${selected.congestionScore}/100`} tone={scoreTone(selected.congestionScore)} />
                <Metric label="Recoverability" value={`${selected.recoverabilityScore}/100`} tone={scoreTone(selected.recoverabilityScore)} />
                <Metric label="Expected Edge" value={formatMoney(edge)} tone={edge > 0 ? "text-emerald-300" : "text-red-300"} />
              </div>
            </div>

            <OrderBook fairValue={selected.fairValueM} />

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center gap-2 text-emerald-300">
                  <Radar className="h-4 w-4" />
                  <span className="text-sm font-semibold">Trade thesis</span>
                </div>
                <div className="space-y-4 text-sm leading-7 text-white/75">
                  <p>
                    <span className="font-semibold text-white">Market setup:</span> {selected.name} sits in a {selected.orbit}
                    corridor with elevated congestion and measurable recovery optionality. Its pricing reflects salvage
                    value, removal rights, and avoidance demand from nearby operators.
                  </p>
                  <p>
                    <span className="font-semibold text-white">Why it trades:</span> higher congestion creates a premium for
                    removal rights, while {selected.rcs.toLowerCase()} radar cross section affects tracking confidence and
                    execution complexity.
                  </p>
                  <p>
                    <span className="font-semibold text-white">Suggested action:</span> {edge > 0 ? "accumulate below fair value and stage recovery execution" : "keep on watch; current mark already prices most upside"}.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center gap-2 text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-sm font-semibold">Execution panel</span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/45">Capital Allocation</div>
                    <div className="mt-1 flex items-center gap-2 text-white"><Wallet className="h-4 w-4 text-emerald-300" /> $12.0M available</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/45">Recommended Size</div>
                    <div className="mt-1 text-xl font-semibold text-white">18 tons equivalent</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/45">Volatility / Risk</div>
                    <div className={`mt-1 text-xl font-semibold ${scoreTone(selected.riskScore)}`}>{selected.riskScore >= 80 ? "High" : selected.riskScore >= 70 ? "Moderate" : "Low"}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
 <button
  onClick={() => setShowTradeModal(true)}
  className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
>
  Buy Recovery Rights
</button>
                  <button className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15">
                    Short Disposal Premium
                  </button>
                  <button className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
                    Add to Structured Watchlist
                  </button>    
                    <button
  onClick={() => setShowLawyerModal(true)}
  className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/15"
>
  <AlertTriangle className="mr-2 inline h-4 w-4" />
  Flag Regulatory Review
</button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-emerald-300">
                  <Gauge className="h-4 w-4" /> Pricing driver
                </div>
                <div className="text-sm leading-7 text-white/70">Congestion density is the dominant premium driver in the current model for {selected.orbit} assets.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-amber-300">
                  <ShieldAlert className="h-4 w-4" /> Risk note
                </div>
                <div className="text-sm leading-7 text-white/70">Large spreads indicate a thin market; use staged entry rather than a single block order.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
                  <Orbit className="h-4 w-4" /> Universe filter
                </div>
                <div className="text-sm leading-7 text-white/70">This live screen excludes deorbited historical objects and surfaces only active or watchlisted orbital inventory.</div>
              </div>
            </div>
          </section>
        </div>
      </div>
              {showTradeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-[400px]">
              <h2 className="text-xl font-semibold mb-4">Trade Module</h2>

              <p className="text-sm text-white/60 mb-4">
                Coming soon: Bid / Ask / Buy functionality
              </p>

              <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-green-600/20 border border-green-500 rounded p-2">
                  Bid
                </button>
                <button className="flex-1 bg-red-600/20 border border-red-500 rounded p-2">
                  Ask
                </button>
                <button className="flex-1 bg-blue-600/20 border border-blue-500 rounded p-2">
                  Buy
                </button>
              </div>

              <button
                onClick={() => setShowTradeModal(false)}
                className="w-full border border-white/20 rounded p-2"
              >
                Close
              </button>
            </div>
          </div>
        )}

    </main>
  );
}
