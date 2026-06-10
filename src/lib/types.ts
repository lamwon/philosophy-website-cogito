export interface Philosopher {
  id: string;
  name: string;
  englishName: string;
  volume: number;
  era: string;
  school: string;
  summary: string;
  keyWorks: string[];
  oppositeIds: string[];
  famousQuote: string;
}

export interface School {
  id: string;
  name: string;
  volume: number;
  description: string;
}

export interface Volume {
  id: number;
  name: string;
  description: string;
}

export interface WisdomQuote {
  id: string;
  text: string;
  source: string;
  chapter: string;
  explanation: string;
  mood: string;
  tags: string[];
}

export interface PhilosophersData {
  philosophers: Philosopher[];
  schools: School[];
  volumes: Volume[];
}

export interface WisdomData {
  buddhism: WisdomQuote[];
  daoism: WisdomQuote[];
  confucianism: WisdomQuote[];
}

export interface AnalysisResult {
  oneliner: string;
  analogy: string;
  deep: string;
  advice: string;
  alternateView: string;
}

export interface WisdomResult {
  quote: string;
  source: string;
  explanation: string;
  meaning: string;
  tradition: 'buddhism' | 'daoism' | 'confucianism';
}

export type Step = 1 | 2 | 3 | 4;

export interface ThinkState {
  step: Step;
  question: string;
  philosopherId: string | null;
  isMismatch: boolean;
  wisdom: string | null;
}
