import { RekognitionClientConfig } from '@aws-sdk/client-rekognition';

export interface ModerationConfiguration {
  aws?: RekognitionClientConfig;
  google?: {
    apiKey?: string;
    keyFile?: string;
  };
  banList?: string[];
  urlBlackList?: string[];
}

export interface ModerationCategory {
  category: string;
  confidence: number;
}
export interface ModerationResult {
  source: string;
  moderation: ModerationCategory[];
}

export interface BannedWord {
  word: string;
  category: string;
}

export interface ThreatsResponse {
  threat?: {
    threatTypes: string[];
    expireTime: string;
  };
}