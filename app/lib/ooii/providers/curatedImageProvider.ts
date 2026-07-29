import {
  CURATED_OBJECT_IMAGES,
  type CuratedObjectImage,
} from "../curatedObjectImages";

function toResolvedImage(entry: CuratedObjectImage) {
  return {
    imageUrl: entry.imageUrl,
    title: entry.canonicalName,
    source: entry.source,
    credit: entry.credit ?? null,
    sourcePageUrl: entry.sourcePageUrl,
    matchType: entry.matchType,
    confidence: entry.matchType === "exact" ? 100 : 80,
    noradId: entry.noradId,
    category: entry.category,
    notes: entry.notes,
  };
}

export function resolveCuratedObjectImage(
  name: string,
  noradId?: string | null
) {
  if (noradId) {
    const exactMatch = CURATED_OBJECT_IMAGES[noradId];

    if (exactMatch) {
      return toResolvedImage(exactMatch);
    }
  }

  const normalizedName = name.trim().toLowerCase();

  const nameMatch = Object.values(CURATED_OBJECT_IMAGES).find(
    (entry) =>
      entry.canonicalName.trim().toLowerCase() === normalizedName
  );

  return nameMatch ? toResolvedImage(nameMatch) : null;
}