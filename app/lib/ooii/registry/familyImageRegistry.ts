export type FamilyImageEntry = {
  imageUrl: string;
  source: string;
  credit?: string;
};

export const FAMILY_IMAGES: Record<string, FamilyImageEntry> = {
   Iridium: {
    imageUrl: "/images/fleet/Iridium.jpg",
    source: "Iridium family representative",
  },
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
   ONEWEB: {
    imageUrl: "/images/fleet/ONEWEB.jpg",
    source: "ONEWEB family representative",
  },
  LANDSAT: {
    imageUrl: "/images/fleet/LANDSAT.jpg",
    source: "LANDSAT family representative",
  },
  GOES: {
    imageUrl: "/images/fleet/GOES.jpg",
    source: "GOES family representative",
    },      
};