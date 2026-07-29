import { resolveCuratedObjectImage } from "./providers/curatedImageProvider";
import { resolveJonathanReference } from "./providers/jonathanProvider";

export async function resolveObjectImage(
  name: string,
  noradId?: string | null
) {
  const curatedResult = resolveCuratedObjectImage(name, noradId);

  if (curatedResult) {
    return curatedResult;
  }

  const jonathanResult = resolveJonathanReference(name, noradId);

  if (jonathanResult) {
    return jonathanResult;
  }

  return null;
}