export interface GeneratedImage {
  id: string;
  url: string;
  view: 'Front' | 'Back';
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface TryOnRequest {
  userImage: string; // Base64
  clothesImages?: string[]; // Array of Base64 strings
  clothesLink?: string;
}