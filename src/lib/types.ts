export interface BtoExercise {
  id: string;
  label: string;
  year: number;
  classification?: "SPP" | "mature-nonmature";
  summary?: {
    [estateType: string]: {
      [flatType: string]: FlatTypeRates;
    };
  };
  towns?: BtoProject[];
  notes?: string;
}

export interface BtoProject {
  town: string;
  estateType: string;
  projectName?: string;   // e.g. "Queensway Canopy"
  lat?: number;           // precise project site latitude
  lng?: number;           // precise project site longitude
  flatTypes: {
    [flatType: string]: FlatTypeRates;
  };
}

export interface FlatTypeRates {
  firstTimer?: number;
  secondTimer?: number;
  singles?: number;
  seniors?: number;
}

export type ApplicantType = "firstTimer" | "secondTimer" | "singles";
export type FlatType =
  | "2-room Flexi"
  | "3-room"
  | "4-room"
  | "5-room"
  | "executive";
export type EstateType =
  | "mature"
  | "non-mature"
  | "standard"
  | "plus"
  | "prime";

export type CompetitionLevel = "low" | "moderate" | "high" | "extreme";

export interface ProfileSelection {
  applicantType: ApplicantType;
  flatType: FlatType;
  estateType: EstateType;
}

export interface ProbabilityResult {
  rate: number | null;
  oddsPerTry: number | null;
  triesFor80: number | null;
  competitionLevel: CompetitionLevel | null;
  cumulativeTable: { tries: number; probability: number }[];
  trendData: { label: string; rate: number }[];
}
