import axios from 'axios';

import { Rekognition } from '@aws-sdk/client-rekognition';
import { LanguageServiceClient } from '@google-cloud/language';
import { SpeechClient, protos } from '@google-cloud/speech';

import sharp from 'sharp';

import URLBlackList from './url-blacklist.json';


import { ModerationCategory, ModerationConfiguration, ModerationResult, ThreatsResponse } from './types';


type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;

type ISpeechRecognitionResult = protos.google.cloud.speech.v1.ISpeechRecognitionResult;

/**
 * Moderation Client
 *
 * @class ModerationClient
 */
class ModerationClient {

  private rekognitionClient?: Rekognition;
  private googleLanguageClient?: LanguageServiceClient;
  private googleSpeechClient?: SpeechClient;
  private googleAPIKey?: string;
  private banList?: string[] = [];
  private urlBlackList?: string[] = [];

  /**
   *
   * @param {ModerationConfiguration} configuration
   */
  constructor (configuration: ModerationConfiguration) {
    if (configuration.aws) {
      this.rekognitionClient = new Rekognition(configuration.aws);
    }

    if (typeof configuration.google?.keyFile === 'string') {
      this.googleLanguageClient = new LanguageServiceClient({ keyFile: configuration.google.keyFile });
      this.googleSpeechClient = new SpeechClient({ keyFile: configuration.google.keyFile });
    }

    if (typeof configuration.google?.apiKey === 'string') {
      this.googleAPIKey = configuration.google.apiKey;
    }

    if (Array.isArray(configuration.banList)) {
      this.banList = configuration.banList;
    }

    if (Array.isArray(configuration.urlBlackList)) {
      this.urlBlackList = configuration.urlBlackList;
    }
  }

  /**
   * Returns a list of moderation categories detected on a text
   *
   * @param {string} text  The text to moderate
   * @param {number} [minimumConfidence = 50] The minimum confidence required for a category to be considered
   *
   * @returns {Promise<ModerationResult>} The list of results that were detected with the minimum confidence specified
   */
  async moderateText (text: string, minimumConfidence: number = 50): Promise<ModerationResult> {
    const categories: ModerationCategory[] = [];

    if (Array.isArray(this.banList)) {
      const normalizedText = text.toLowerCase();
      const matches = this.banList.filter(w => normalizedText.indexOf(w) > -1);

      if (matches.length > 0) {
        const words = normalizedText.split(' ');

        categories.push({
          category: 'BAN_LIST',
          confidence: (matches.length / words.length) * 100,
        });
      }
    }


    if (typeof this.googleLanguageClient === 'undefined') {
      return { source: text, moderation: categories };
    }

    const [ result ] = await this.googleLanguageClient.moderateText({
      document: {
        content: text,
        type: 'PLAIN_TEXT',
      },
    });

    if (result && 'moderationCategories' in result) {
      if (Array.isArray(result.moderationCategories)) {
        const results = result.moderationCategories.map(c => ({
          category: c.name ?? 'Unknown',
          confidence: (c.confidence ?? 0) * 100,
        })).filter(c => c.confidence >= minimumConfidence);
        return { source: text, moderation: [...categories, ...results] };
      }
    }

    return { source: text, moderation: [] };
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
  async moderateImage (url: string, minimumConfidence: number = 95): Promise<ModerationResult> {
    if (typeof this.rekognitionClient === 'undefined') {
      return { source: url, moderation: [] };
    }

    const { data } = await axios.get<string>(url, { responseType: 'arraybuffer' });

    let buffer: Buffer | null = null;

    // GIFs will be split into frames
    if (url.toLowerCase().indexOf('.gif') > -1) {
      buffer = await sharp(data, { pages: -1 }).toFormat('png').toBuffer();
    } else if (url.toLowerCase().indexOf('.webp') > -1) {
      buffer = await sharp(data).toFormat('png').toBuffer();
    } else {
       // Download image as binary data
      buffer = Buffer.from(data, 'binary');
    }

    const { ModerationLabels } = await this.rekognitionClient.detectModerationLabels({
      Image: {
        Bytes: buffer
      },
      MinConfidence: minimumConfidence
    });

    if (Array.isArray(ModerationLabels)) {
      const moderation = ModerationLabels.map(l => ({
        category: l.Name ?? 'Unknown',
        confidence: l.Confidence ?? 0,
      }));

      return { source: url, moderation };
    }

    return { source: url, moderation: [] };
  }

  async moderateLink (url: string): Promise<ModerationResult> {
    const blacklisted = this.urlBlackList?.some(b => url.indexOf(b) > -1);

    if (blacklisted) {
      return { source: url, moderation: [{ category: 'CUSTOM_BLACK_LIST', confidence: 100 }] };
    }

    const globallyBlacklisted = URLBlackList.some(b => url.indexOf(b) > -1);

    if (globallyBlacklisted) {
      return { source: url, moderation: [{ category: 'BLACK_LIST', confidence: 100 }] };
    }


    if (typeof this.googleAPIKey !== 'string') {
      return { source: url, moderation: [] };
    }

    const types = [
      'MALWARE',
      'SOCIAL_ENGINEERING',
      'UNWANTED_SOFTWARE',
      'SOCIAL_ENGINEERING_EXTENDED_COVERAGE'
    ];

    const threatTypes = types.join('&threatTypes=');
    const requestUrl = `https://webrisk.googleapis.com/v1/uris:search?threatTypes=${threatTypes}&key=${this.googleAPIKey}`;

    const { data } = await axios.get<ThreatsResponse>(`${requestUrl}&uri=${encodeURIComponent(url)}`);

    const threats = data?.threat?.threatTypes;

    if (Array.isArray(threats)) {
      const moderation = threats.map(t => ({
        category: t,
        confidence: 100,
      }));

      return { source: url, moderation };
    }

    return { source: url, moderation: [] };
  }

  async moderateAudio (url: string, language: string = 'en-US', minimumConfidence: number = 50): Promise<ModerationResult> {
    if (typeof this.googleSpeechClient === 'undefined') {
      return { source: url, moderation: [] };
    }

    const { data } = await axios.get<string>(url, { responseType: 'arraybuffer' });


    const options: IRecognitionConfig = {
      encoding: 'OGG_OPUS',
      sampleRateHertz: 48000,
      languageCode: language,
    };

    const [ response ] = await this.googleSpeechClient.recognize ({
      audio: { content: Buffer.from(data, 'binary').toString('base64') },
      config: options,
    });

    if (!Array.isArray(response?.results)) {
      return { source: url, moderation: [] };
    }

    const transcription = response?.results?.map((result: ISpeechRecognitionResult) => result.alternatives?.at(0)?.transcript ?? '').join(' ');

    return this.moderateText(transcription, minimumConfidence);
  }

}

export default ModerationClient;