import { ModerationConfiguration, ModerationResult } from './types';
/**
 * Moderation Client
 *
 * @class ModerationClient
 */
declare class ModerationClient {
    private rekognitionClient?;
    private googleLanguageClient?;
    private googleSpeechClient?;
    private googleAPIKey?;
    private banList?;
    private urlBlackList?;
    /**
     *
     * @param {ModerationConfiguration} configuration
     */
    constructor(configuration: ModerationConfiguration);
    /**
     * Returns a list of moderation categories detected on a text
     *
     * @param {string} text  The text to moderate
     * @param {number} [minimumConfidence = 50] The minimum confidence required for a category to be considered
     *
     * @returns {Promise<ModerationResult>} The list of results that were detected with the minimum confidence specified
     */
    moderateText(text: string, minimumConfidence?: number): Promise<ModerationResult>;
    /**
     * Returns a list of moderation categories detected on an image
     *
     * @param {string} url
     * @param {number} [minimumConfidence = 95]  The minimum confidence required for a category to be considered
     *
     *
     * @returns {Promise<ModerationResult[]>} The list of results that were detected with the minimum confidence specified
     */
    moderateImage(url: string, minimumConfidence?: number): Promise<ModerationResult>;
    moderateLink(url: string): Promise<ModerationResult>;
    moderateAudio(url: string, language?: string, minimumConfidence?: number): Promise<ModerationResult>;
}
export default ModerationClient;
