"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const language_1 = require("@google-cloud/language");
const { GOOGLE_APPLICATION_CREDENTIALS } = process.env;
/**
 * Moderation Client
 */
class ModerationClient {
    rekognitionClient;
    googleLanguageClient;
    /**
     *
     * @param {ModerationConfiguration} configuration
     */
    constructor(configuration) {
        if (configuration.aws) {
            this.rekognitionClient = new client_rekognition_1.Rekognition(configuration.aws);
        }
        if (GOOGLE_APPLICATION_CREDENTIALS) {
            this.googleLanguageClient = new language_1.LanguageServiceClient();
        }
    }
    /**
     * Returns a list of moderation categories detected on a text
     *
     * @param {string} text  The text to moderate
     * @param {number} [minimumConfidence = 50] The minimum confidence required for a category to be considered
     *
     * @returns {Promise<ModerationResult[]>} The list of results that were detected with the minimum confidence specified
     */
    async moderateText(text, minimumConfidence = 50) {
        if (typeof this.googleLanguageClient === 'undefined') {
            return [];
        }
        const [result] = await this.googleLanguageClient.moderateText({
            document: {
                content: text,
                type: 'PLAIN_TEXT',
            },
        });
        if (result && 'moderationCategories' in result) {
            if (Array.isArray(result.moderationCategories)) {
                return result.moderationCategories.map(c => ({
                    category: c.name ?? 'Unknown',
                    confidence: c.confidence ?? 0,
                })).filter(c => c.confidence >= minimumConfidence);
            }
        }
        return [];
    }
    /**
     * Returns a list of moderation categories detected on an image
     *
     * @param {string} url
     * @param {number} [minimumConfidence = 95]  The minimum confidence required for a category to be considered
     *
     *
     * @returns {Promise<ModerationResult[]>} The list of results that were detected with the minimum confidence specified
     */
    async moderateImage(url, minimumConfidence = 95) {
        if (typeof this.rekognitionClient === 'undefined') {
            return [];
        }
        // Download image as binary data
        const { data } = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(data, 'binary');
        const { ModerationLabels } = await this.rekognitionClient.detectModerationLabels({
            Image: {
                Bytes: buffer
            },
            MinConfidence: minimumConfidence
        });
        if (Array.isArray(ModerationLabels)) {
            return ModerationLabels.map(l => ({
                category: l.Name ?? 'Unknown',
                confidence: l.Confidence ?? 0,
            }));
        }
        return [];
    }
}
exports.default = ModerationClient;
