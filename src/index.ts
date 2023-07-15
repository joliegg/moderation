import axios from 'axios';

import { Rekognition } from "@aws-sdk/client-rekognition";
import { LanguageServiceClient } from "@google-cloud/language";

import { ModerationConfiguration, ModerationResult } from './types';

const { GOOGLE_APPLICATION_CREDENTIALS } = process.env;

/**
 * Moderation Client
 *
 * @name ModerationClient
 */
class ModerationClient {

  private rekognitionClient?: Rekognition;
  private googleLanguageClient?: LanguageServiceClient;


  /**
   *
   * @param {ModerationConfiguration} configuration
   */
  constructor (configuration: ModerationConfiguration) {
    if (configuration.aws) {
      this.rekognitionClient = new Rekognition(configuration.aws);
    }

    // Google library autoloads credentials when their env variable is defined
    if (configuration.google === true && GOOGLE_APPLICATION_CREDENTIALS) {
      this.googleLanguageClient = new LanguageServiceClient();
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
  async moderateText (text: string, minimumConfidence: number = 50): Promise<ModerationResult[]> {
    if (typeof this.googleLanguageClient === 'undefined') {
      return [];
    }

    const [ result ] = await this.googleLanguageClient.moderateText({
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
  async moderateImage (url: string, minimumConfidence: number = 95): Promise<ModerationResult[]> {
    if (typeof this.rekognitionClient === 'undefined') {
      return [];
    }

    // Download image as binary data
    const { data } = await axios.get<string>(url, { responseType: 'arraybuffer' });

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

export default ModerationClient;