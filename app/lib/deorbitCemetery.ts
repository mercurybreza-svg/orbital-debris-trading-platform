export type CemeteryObject = {
  id: string;
  name: string;
  objectType: "DEBRIS" | "ROCKET BODY" | "PAYLOAD";
  orbit: "LEO" | "MEO" | "GEO";
  decayDate: string;
  mission: string;
  historicalValueM: number;
  intrinsicValueM: number;
  estimatedLostValueM: number;
  imageUrl: string;
  imageCredit: string;
  imageSource: string;
};

export const deorbitCemetery: CemeteryObject[] = [
{
  id: "STS-ET",
  name: "Space Shuttle External Tank",
  objectType: "ROCKET BODY",
  orbit: "LEO",
  decayDate: "Multiple missions, 1981–2011",
  mission:
    "Space Shuttle external propellant tank discarded during ascent.",
  historicalValueM: 8.5,
  intrinsicValueM: 2.2,
  estimatedLostValueM: 10.7,

  imageUrl: "/images/cemetery/shuttle-external-tank.jpg",
  imageCredit: "NASA",
  imageSource: "OOCEX curated archive",
}
 , {
    id: "ISS NiH2 Battery",
    name: "ISS NiH2 Battery",
    objectType: "ROCKET BODY",
    orbit: "LEO",
    decayDate: "2021",
  mission:
    "ISS Nickel-Hydrogen Battery deorbited for lithium battery upgrade.",
  historicalValueM: 8.5,
  intrinsicValueM: 2.2,
  estimatedLostValueM: 10.7,

  imageUrl: "/images/cemetery/ISS-NiH2-Battery.jpg",
  imageCredit: "NASA",
  imageSource: "OOCEX Curated Archive",
  },
];