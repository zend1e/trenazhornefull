
export interface Phrase {
  id: number;
  text: string;
}

export interface TrajectoryPreset {
  key: string;
  title: string;
}

export interface Params {
  speed: number;
  textSize: number;
  color: string;
  interval: number;
}

export interface Level {
  id: string;
  name: string;
  phrases: Phrase[];
  trajPresets: TrajectoryPreset[];
  params: Params;
}

export type AppStep = 'start' | 'choose-level' | 'params-setup' | 'trainer' | 'done';