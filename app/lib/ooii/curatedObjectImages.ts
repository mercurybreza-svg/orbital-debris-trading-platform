export type CuratedObjectImage = {
  noradId: string;
  canonicalName: string;
  imageUrl: string;
  source: string;
  sourcePageUrl?: string;
  credit?: string;
  category: "LEO" | "MEO" | "LOD" | "SSOO" | "OC";
  matchType: "exact" | "family";
  notes?: string;
};

export const CURATED_OBJECT_IMAGES: Record<
  string,
  CuratedObjectImage
> = {
  "116": {
    noradId: "116",
    canonicalName: "Transit 4A",
    imageUrl: "/images/real/transit-4a.jpg",
    source: "OOCEX Curated Archive",
    sourcePageUrl: "https://planet4589.org/space/",
    credit: "Historical image curated by the OOCEX research team",
    category: "LOD",
    matchType: "exact",
    notes: "Approved exact image for Transit 4A",
  },

  "11080": {
    noradId: "11080",
    canonicalName: "Nimbus 7",
    imageUrl: "/images/real/nimbus-7.jpg",
    source: "OOCEX Curated Archive",
    credit: "NASA",
    category: "LOD",
    matchType: "exact",
  },
  "16631": {
  noradId: "16631",
  canonicalName: "USA 18",
  imageUrl: "/images/real/usa-18.jpg",
  source: "OOCEX Curated Archive",
  sourcePageUrl: "https://...",
  credit: "Original source credit",
  category: "LOD",
  matchType: "exact",
  notes: "Approved by OOCEX research team",
  
},
};