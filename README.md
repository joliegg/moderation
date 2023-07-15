[![Hippocratic License HL3-CL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-CL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/cl.html)

# Chat Moderation

This library uses AWS Rekognition to generate moderation tags for images and Google's Language library to moderate text.

So far only JPEG and PNG images are supported for moderation.

## Installation

```bash
yarn add @kirino-bot/moderation
```


### Initialization


```js
import ModerationClient from '@kirino-bot/moderation';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_ACCESS_KEY_SECRET } = process.env;

const client = new ModerationClient({
  aws: {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_ACCESS_KEY_SECRET
  },
}
});

```

### Moderating Text

```js
const textModeration = await client.moderateText('This is some text that might need moderation');
```

### Moderating Images

```js

const imageModeration = await client.moderateImage('https://example.example/image.png');
```