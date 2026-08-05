import { getObjectProfile } from "./getObjectProfile";
import { resolveJonathanReference } from "./providers/jonathanProvider";

export async function resolveObjectImage(
  name: string,
  noradId?: string | null
) {
  const profile = getObjectProfile(name, noradId);

  if (profile.imageUrl) {
    return {
      imageUrl: profile.imageUrl,
      title: profile.canonicalName,
      source: profile.source,
      credit: null,
      matchType: profile.imageType,
      confidence: profile.confidence,
      noradId: noradId ?? null,
    };
  }

  const jonathanResult = resolveJonathanReference(name, noradId);

  if (jonathanResult) {
    return jonathanResult;
  }

  return null;
}