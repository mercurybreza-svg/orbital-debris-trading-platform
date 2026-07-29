export type ObjectAlias = {
  canonicalName: string;
  family?: string;
  alternateNames: string[];
};

export const OBJECT_ALIASES: Record<string, ObjectAlias> = {
  "116": {
    canonicalName: "Transit 4A",
    family: "Transit",
    alternateNames: [
      "Transit 4A satellite",
      "Transit 4A navigation satellite",
      "Transit 4A US Navy satellite",
    ],
  },

  "11080": {
    canonicalName: "Nimbus 7",
    family: "Nimbus",
    alternateNames: [
      "Nimbus 7 satellite",
      "Nimbus 7 weather satellite",
    ],
  },
};