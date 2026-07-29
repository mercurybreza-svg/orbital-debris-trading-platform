export type JonathanImageReference = {
  noradId?: string;
  canonicalName: string;
  pageUrl: string;
  imageUrl?: string;
  credit?: string;
  confidence: "exact" | "family";
};

export const JONATHAN_IMAGE_REFERENCES: JonathanImageReference[] = [
  {
    noradId: "116",
    canonicalName: "Transit 4A",
  pageUrl: "https://planet4589.org/space/",
    imageUrl: "/images/real/transit-4a.jpg",
    credit: "Source reference: Jonathan's Space Report",
    confidence: "exact",
  },
];
export function resolveJonathanReference(
  name: string,
  noradId?: string | null
) {
  const normalizedName = name.trim().toLowerCase();

  const match = JONATHAN_IMAGE_REFERENCES.find((entry) => {
    if (noradId && entry.noradId === noradId) {
      return true;
    }
    return entry.canonicalName.toLowerCase() === normalizedName;
  });

  if (!match) {
    return null;
  }

  return {
    imageUrl: match.imageUrl,
    title: match.canonicalName,
    source: "Jonathan's Space Report",
    credit: match.credit ?? null,
    sourcePageUrl: match.pageUrl,
    matchType: match.confidence,
    confidence: match.confidence === "exact" ? 100 : 70,
    noradId: match.noradId ?? noradId ?? null,
  };
}