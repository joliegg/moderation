import { RekognitionClientConfig } from '@aws-sdk/client-rekognition';
export interface ModerationConfiguration {
    aws?: RekognitionClientConfig;
    google?: boolean;
}
export interface ModerationResult {
    category: string;
    confidence: number;
}
