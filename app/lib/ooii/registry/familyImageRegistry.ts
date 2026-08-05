export type FamilyImageEntry = {
  imageUrl: string;
  source: string;
  credit?: string;
};

export const FAMILY_IMAGES: Record<string, FamilyImageEntry> = {
  TRANSIT: {
    imageUrl: "/images/real/transit-4a.jpg",
    source: "Transit family representative",
  },

  GPS: {
    imageUrl: "/images/fleet/gps.jpg",
    source: "GPS family representative",
  },

 STARLINK: {
  imageUrl: "/images/starlink-placeholder.jpg",
  source: "Starlink family representative",
},
  NOAA: {
    imageUrl: "/images/fleet/noaa.jpg",
    source: "NOAA family representative",
  },
};