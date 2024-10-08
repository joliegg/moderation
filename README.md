[![Hippocratic License HL3-CL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-CL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/cl.html)

# Chat Moderation

This library uses AWS Rekognition to generate moderation tags for images and Google's Language and Speech libraries to moderate text and audio files.

## Installation

```bash
yarn add @joliegg/moderation
```


### Initialization


```js
import ModerationClient from '@joliegg/moderation';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_ACCESS_KEY_SECRET, GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_API_KEY } = process.env;

const client = new ModerationClient({
  aws: {
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_ACCESS_KEY_SECRET
    },
  },
  google: {
    keyFile: GOOGLE_APPLICATION_CREDENTIALS,
    apiKey: GOOGLE_API_KEY
  },
  banlist: ['some word'],
  urlBlackList: ['someurl.example'],
});
```

### Moderating Text

```js
const textModeration = await client.moderateText('This is some text that might need moderation');
```

### Moderating Images
Since only JPEG and PNG images are natively supported by AWS for moderation, GIF images will be converted into a sprite sheet and WEBP images will be converted to PNG.

```js

const imageModeration = await client.moderateImage('https://example.example/image.png');
```

### Moderating Audios
Currently only OGG files are supported

```js

const audioModeration = await client.moderateAudio('https://example.example/image.ogg', 'en-US');
```

### Moderating Links
Link moderation will use the Google WebRisk API to check links. A Blacklist is also included for known scam urls.


```js

const linkModeration = await client.moderateLink('https://example.example/link');
```

Link shorteners trigger a warning by default as they are considered non-trustable. If they need to be allowed, set its flag to true.

```js

const linkModeration = await client.moderateLink('https://t.ly/link', true);
```