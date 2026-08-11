export type FamilyImageEntry = {
  imageUrl: string;
  source: string;
  credit?: string;
};

export const FAMILY_IMAGES: Record<string, FamilyImageEntry> = {
   IRIDIUM: {
  imageUrl: "/images/fleet/iridium.jpg",
  source: "OOCEX Iridium family representative",
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
  imageUrl: "/images/fleet/oneweb.jpg",
  source: "OOCEX OneWeb family representative",
},
LANDSAT: {
  imageUrl: "/images/fleet/landsat.jpg",
  source: "OOCEX Landsat family representative",
},
 GOES: {
  imageUrl: "/images/fleet/goes.jpg",
  source: "OOCEX GOES family representative",
},     
};