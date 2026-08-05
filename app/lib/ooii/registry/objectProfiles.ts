export type OrbitalObjectProfile = {
  noradId: string;
  canonicalName: string;

  aliases: string[];

  family: string | null;

  owner: string | null;

  manufacturer: string | null;

  mission: string | null;

  category:
    | "LEO"
    | "MEO"
    | "LOD"
    | "SSOO"
    | "OC";

  notes?: string;
};

export const OBJECT_PROFILES: OrbitalObjectProfile[] = [

  {
    noradId: "116",

    canonicalName: "Transit 4A",

    aliases: [
      "Transit 4A",
      "Transit IV-A"
    ],

    family: "TRANSIT",

    owner: "United States Navy",

    manufacturer: "Johns Hopkins Applied Physics Laboratory",

    mission: "Navigation satellite",

    category: "LOD",

    notes: "First curated OOII profile",
  },
{
  noradId: "670",
  canonicalName: "Transit 5B-1",
  aliases: ["Transit 5B-1"],
  family: "TRANSIT",
  owner: "United States Navy",
  manufacturer: null,
  mission: "Navigation satellite",
  category: "LOD",
},
  {
    noradId: "16631",

    canonicalName: "USA 18",

    aliases: [
      "USA 18"
    ],

    family: null,

    owner: "United States",

    manufacturer: null,

    mission: "Classified",

    category: "LOD",
  },

];