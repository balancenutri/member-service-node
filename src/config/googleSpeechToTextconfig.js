import { SpeechClient } from "@google-cloud/speech";

const speech = new SpeechClient({
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
});

export { speech };
