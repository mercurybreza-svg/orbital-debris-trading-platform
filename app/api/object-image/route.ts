
import { resolveObjectImage } from "@/app/lib/ooii/resolveObjectImage";
import { NextRequest, NextResponse } from "next/server";

type ResolvedImage = {
  imageUrl: string | null;
  title: string | null;
  source: string | null;
  credit: string | null;
};

type NasaItem = {
  data?: Array<{
    title?: string;
    description?: string;
    description_508?: string;
    photographer?: string;
    center?: string;
  }>;
  links?: Array<{
    href?: string;
    render?: string;
  }>;
};
const POSITIVE_IMAGE_TERMS = [
  "spacecraft",
  "satellite",
  "observatory",
  "orbiter",
  "vehicle",
  "mission",
  "flight model",
  "engineering model",
  "artist concept",
  "artist conception",
  "illustration",
  "rendering",
  "in orbit",
  "on orbit",
  "assembly",
  "integration",
  "launch",
];

const NEGATIVE_IMAGE_TERMS = [
  "report",
  "paper",
  "book",
  "cover",
  "document",
  "manual",
  "conference",
  "presentation",
  "chart",
  "graph",
  "table",
  "diagram",
  "poster",
  "newsletter",
  "architecture",
  "thesis",
  "bibliography",
  "page",
  "volume",
];

function normalizeText(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stripHtml(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function getMissionTokens(name: string) {
  return name
    .toUpperCase()
    .replace(/[()[\],/]/g, " ")
    .split(/[\s-]+/)
    .filter((token) => token.length >= 3)
    .filter(
      (token) =>
        !["SATELLITE", "SPACECRAFT", "PAYLOAD", "ROCKET", "BODY"].includes(token)
    );
}

function scoreImageCandidate({
  objectName,
  title,
  description,
}: {
  objectName: string;
  title?: string;
  description?: string;
}) {
  const searchable = normalizeText(`${title ?? ""} ${description ?? ""}`);
  const titleText = normalizeText(title);
  const tokens = getMissionTokens(objectName);

  let score = 0;

  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();

    if (titleText.includes(normalizedToken)) {
      score += 12;
    } else if (searchable.includes(normalizedToken)) {
      score += 5;
    }
  }

  for (const term of POSITIVE_IMAGE_TERMS) {
    if (searchable.includes(term)) score += 4;
  }

  for (const term of NEGATIVE_IMAGE_TERMS) {
    if (searchable.includes(term)) score -= 15;
  }

  return score;
}
function getSearchNames(
  name: string,
  noradId?: string | null
): string[] {
  const cleanName = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bDEB\b/gi, " ")
    .replace(/\bR\/B\b/gi, " ")
    .replace(/\bROCKET BODY\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove trailing catalog/unit numbers:
  // "NIMBUS 7" → "NIMBUS"
  // "SSU 3" → "SSU"
  // "COSMOS 628" → "COSMOS"
  const familyName = cleanName
    .replace(/[-\s]+\d+[A-Z]*$/i, "")
    .trim();

  const variants: string[] = [
    cleanName,
    `${cleanName} satellite`,
    `${cleanName} spacecraft`,
  ];

  if (familyName && familyName !== cleanName) {
    variants.push(
      familyName,
      `${familyName} satellite`,
      `${familyName} spacecraft`,
      `${familyName} spacecraft rendering`
    );
  }

  if (/^COSMOS\b/i.test(cleanName)) {
    const kosmosName = cleanName.replace(/^COSMOS\b/i, "KOSMOS");

    
  }

  if (/^KOSMOS\b/i.test(cleanName)) {
    const cosmosName = cleanName.replace(/^KOSMOS\b/i, "COSMOS");

    variants.push(
      cosmosName,
      `${cosmosName} satellite`
    );
  }

  if (/^STARLINK\b/i.test(cleanName)) {
    variants.push(
      "Starlink satellite",
      "SpaceX Starlink spacecraft"
    );
  }

  if (/^MOLNIYA\b/i.test(cleanName)) {
    variants.push(
      "Molniya satellite",
      "Molniya communications satellite spacecraft"
    );
  }

  if (/^SSU\b/i.test(cleanName)) {
    variants.push(
      "satellite spacecraft rendering"
    );
  }

  if (noradId) {
    variants.push(`${cleanName} NORAD ${noradId}`);
  }

  return [...new Set(
    variants
      .map((variant) => variant.trim())
      .filter(Boolean)
  )];
}
function getIdentityTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[()[\],/]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter((token) => token.length > 2);
}

function hasIdentityMatch(
  objectName: string,
  title: string,
  description: string
) {
  const searchable =
    `${title} ${description}`.toLowerCase();

  const tokens = getIdentityTokens(objectName);

  return tokens.some(token =>
    searchable.includes(token)
  );
}
async function searchNasa(name: string): Promise<ResolvedImage | null> {
  const query = encodeURIComponent(`${name} spacecraft satellite`);

  const response = await fetch(
    `https://images-api.nasa.gov/search?q=${query}&media_type=image`,
    {
      next: { revalidate: 86400 },
    }
  );

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const items: NasaItem[] = json?.collection?.items ?? [];


  
const rankedItems = items
  .map((item) => {
    const metadata = item.data?.[0];

    const image = item.links?.find(
      (link) => link.render === "image" && Boolean(link.href)
    );

    if (!image?.href) return null;

    const description =
      metadata?.description ?? metadata?.description_508 ?? "";

    return {
      item,
      imageUrl: image.href,
      metadata,
      score: scoreImageCandidate({
        objectName: name,
        title: metadata?.title,
        description,
      }),
    };
  })
  .filter(
    (
      candidate
    ): candidate is NonNullable<typeof candidate> =>
      candidate !== null
  )
  .sort((a, b) => b.score - a.score);

const best = rankedItems[0];

if (!best || best.score < 10) {
  return null;
}

return {
  imageUrl: best.imageUrl,
  title: best.metadata?.title ?? null,
  source: "NASA Image and Video Library",
  credit:
    best.metadata?.photographer ??
    best.metadata?.center ??
    "NASA",
};
}

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: {
      Artist?: { value?: string };
      Credit?: { value?: string };
      Attribution?: { value?: string };
      ImageDescription?: { value?: string };
      ObjectName?: { value?: string };
      Categories?: { value?: string };
    };
  }>;
};

async function searchCommons(
  name: string
): Promise<ResolvedImage | null> {
  const search = encodeURIComponent(
    `"${name}" spacecraft satellite observatory`
  );

  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    `&gsrsearch=${search}` +
    "&gsrnamespace=6" +
    "&gsrlimit=20" +
    "&prop=imageinfo" +
    "&iiprop=url|mime|size|extmetadata" +
    "&iiurlwidth=1200" +
    "&format=json" +
    "&origin=*";

  const response = await fetch(url, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();

  const pages = Object.values(
    json?.query?.pages ?? {}
  ) as CommonsPage[];

  const rankedPages = pages
    .map((page) => {
      const info = page.imageinfo?.[0];

      if (!info) return null;

      const imageUrl = info.thumburl ?? info.url;
      const mime = info.mime ?? "";

      if (!imageUrl || !mime.startsWith("image/")) {
        return null;
      }

      const metadata = info.extmetadata ?? {};

      const description = stripHtml(
        metadata.ImageDescription?.value ??
          metadata.ObjectName?.value ??
          metadata.Categories?.value
      );

      const title = page.title?.replace(/^File:/, "") ?? "";

      return {
        page,
        info,
        imageUrl,
        score: scoreImageCandidate({
          objectName: name,
          title,
          description,
        }),
      };
    })
    .filter(
      (
        candidate
      ): candidate is NonNullable<typeof candidate> =>
        candidate !== null
    )
    .sort((a, b) => b.score - a.score);

  const best = rankedPages[0];

  if (!best || best.score < 10) {
    return null;
  }

  const metadata = best.info.extmetadata ?? {};

  return {
    imageUrl: best.imageUrl,
    title: best.page.title?.replace(/^File:/, "") ?? null,
    source: "Wikimedia Commons",
    credit:
      stripHtml(
        metadata.Artist?.value ??
          metadata.Credit?.value ??
          metadata.Attribution?.value
      ) || "Wikimedia Commons",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const name = searchParams.get("name");
  const noradId = searchParams.get("norad");

  if (!name) {
    return NextResponse.json(
      {
        imageUrl: null,
        title: null,
        source: null,
        credit: null,
        error: "Missing object name",
      },
      { status: 400 }
    );
  }

 try {
 const ooiiResult = await resolveObjectImage(name, noradId);

if (ooiiResult) {
  return NextResponse.json(ooiiResult);
} const jonathanResult = await resolveObjectImage(name, noradId);

  if (jonathanResult) {
    return NextResponse.json(jonathanResult);
  }

  const searchNames = getSearchNames(name, noradId);

  for (const searchName of searchNames) {
    const commonsResult = await searchCommons(searchName);

    if (commonsResult) {
      return NextResponse.json({
        ...commonsResult,
        matchedQuery: searchName,
        noradId: noradId ?? null,
      });
    }

    const nasaResult = await searchNasa(searchName);

    if (nasaResult) {
      return NextResponse.json({
        ...nasaResult,
        matchedQuery: searchName,
        noradId: noradId ?? null,
      });
    }
  }

  return NextResponse.json({
    imageUrl: null,
    title: null,
    source: null,
    credit: null,
    noradId: noradId ?? null,
    searchedQueries: searchNames,
  });
} catch (error) {
  console.error("Object image resolver failed:", error);

  return NextResponse.json(
    {
      imageUrl: null,
      title: null,
      source: null,
      credit: null,
      noradId: noradId ?? null,
      error: "Image resolver failed",
    },
    { status: 500 }
  );
}

}