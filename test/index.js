const { default: ModerationClient } = require('../dist/index.js');

const moderationClient = new ModerationClient({
  aws: {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
  },
  google: {
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    apiKey: process.env.GOOGLE_API_KEY,
  },
  banList: ['badword'],
});

(async () => {
  // Check if custom bad words are being detected
  console.log(await moderationClient.moderateText('This is somebadword text', 50));

  console.log(await moderationClient.moderateText('This is a text with no bad words.', 50));

  // Check if Blacklist is working
  console.log(await moderationClient.moderateLink('660060wwr-roblox.com'));
})();