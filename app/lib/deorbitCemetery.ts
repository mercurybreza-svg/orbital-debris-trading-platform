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
    mission: "Space Shuttle external propellant tank discarded during ascent.",
    historicalValueM: 18,
    intrinsicValueM: 32,
    estimatedLostValueM: 50,
    imageUrl: "file:///C:/Users/mercu/Desktop/Orbital%20Objects/shuttle-external-tank.jpg",
    imageCredit: "NASA",
    imageSource: "NASA",
  },
];