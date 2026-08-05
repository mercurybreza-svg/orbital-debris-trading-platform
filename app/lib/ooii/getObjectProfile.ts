import { OBJECT_ALIASES } from "./objectAliases";
import { EXACT_IMAGES } from "./registry/exactImageRegistry";
import { FAMILY_IMAGES } from "./registry/familyImageRegistry";
import { OBJECT_PROFILES } from "./registry/objectProfiles";

export type ObjectProfile = {
  noradId: string | null;

  canonicalName: string;

  aliases: string[];

  family: string | null;

  imageUrl: string | null;

  imageType:
    | "exact"
    | "family"
    | "external"
    | "placeholder";

  owner: string | null;

  manufacturer: string | null;

  mission: string | null;

  source: string;

  confidence: number;
};
function inferFamilyFromName(name: string): string | null {
  const normalized = name.trim().toUpperCase();

  // STARLINK intentionally omitted so strict external search may resolve it.
  if (normalized.includes("TRANSIT")) return "TRANSIT";
  if (normalized.includes("ONEWEB")) return "ONEWEB";
  if (normalized.includes("IRIDIUM")) return "IRIDIUM";
  if (normalized.includes("GPS")) return "GPS";
  if (normalized.includes("NOAA")) return "NOAA";
  if (normalized.includes("GOES")) return "GOES";
  if (normalized.includes("LANDSAT")) return "LANDSAT";
  if (normalized.includes("INTELSAT")) return "INTELSAT";
  if (normalized.includes("EUTELSAT")) return "EUTELSAT";

  return null;
}

export function getObjectProfile(
  name: string,
  noradId?: string | null
): ObjectProfile {
  const normalizedName = name.trim().toUpperCase();

  const alias =
    noradId && OBJECT_ALIASES[noradId]
      ? OBJECT_ALIASES[noradId]
      : undefined;

  const objectProfile = OBJECT_PROFILES.find(
    (profile) =>
      (noradId && profile.noradId === noradId) ||
      profile.canonicalName.trim().toUpperCase() === normalizedName
  );

  const family =
  objectProfile?.family ??
  alias?.family ??
  inferFamilyFromName(name);

  const exactImage =
    noradId && EXACT_IMAGES[noradId]
      ? EXACT_IMAGES[noradId]
      : undefined;

  const familyImage =
    family && FAMILY_IMAGES[family.toUpperCase()]
      ? FAMILY_IMAGES[family.toUpperCase()]
      : undefined;

  const selectedImage = exactImage ?? familyImage;

  return {
    noradId: noradId ?? null,

    canonicalName:
      objectProfile?.canonicalName ??
      alias?.canonicalName ??
      name,

    aliases:
      objectProfile?.aliases ??
      alias?.alternateNames ??
      [],

    family,

    imageUrl:
      selectedImage?.imageUrl ??
      null,

    imageType:
      exactImage
        ? "exact"
        : familyImage
          ? "family"
          : "placeholder",

    owner:
      objectProfile?.owner ??
      null,

    manufacturer:
      objectProfile?.manufacturer ??
      null,

    mission:
      objectProfile?.mission ??
      null,

    source:
      selectedImage?.source ??
      "OOII",

    confidence:
      exactImage
        ? 100
        : familyImage
          ? 80
          : 0,
  };
}