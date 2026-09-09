export type DurationType = "laps" | "time" | "heat" | "other";

export interface Duration {
  type: DurationType;
  laps: number | null;
  minutes: number | null;
  label: string;
  heats?: { h?: number; c?: number; f?: number };
}

export interface Week {
  week: number;
  start: string; // YYYY-MM-DD, terça em que a semana abre
  track: string;
  cars: string[] | null; // só nas séries que trocam de carro por semana
  simTime: string | null; // hora do dia dentro do sim
  timeScale: string | null;
  tempC: number | null;
  rain: string | null;
  settings: string;
  carRules: string[] | null;
  duration: Duration;
}

export interface Series {
  id: string;
  name: string;
  shortName: string;
  category: string;
  licenseClass: string;
  fixedSetup: boolean;
  cars: string[];
  weeklyCars: boolean;
  multiclass: boolean;
  licenseFrom: string | null;
  licenseFromSR: number | null;
  licenseTo: string | null;
  raceFrequency: string | null;
  minEntries: number | null;
  splitAt: number | null;
  drops: number | null;
  incidentPenalty: number | null;
  incidentDQ: number | null;
  ruleSet: string | null;
  durationTypes: DurationType[];
  minMinutes: number | null;
  maxMinutes: number | null;
  minLaps: number | null;
  maxLaps: number | null;
  weekCount: number;
  tracks: string[];
  weeks: Week[];
}

export interface ContentItem {
  name: string;
  series: string[];
  count: number;
}

export interface Schedule {
  season: string;
  generatedFrom: string;
  categories: string[];
  licenseClasses: string[];
  weekStarts: string[];
  seasonWeeks: string[];
  series: Series[];
  cars: ContentItem[];
  tracks: ContentItem[];
}
