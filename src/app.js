import express from "express";
import cors from "cors";
import morgan from "morgan";
import { configDotenv } from "dotenv";
import twilio from "twilio";

configDotenv();

const app = express();
const PORT = process.env.PORT || 8080;

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:8080"],
  })
);
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.write("Hello World!");
});
app.post("/token", async (req, res) => {
  const { identity } = req.body;
  try {
    if (!identity) {
      return res.status(400).json({
        success: false,
        message: "Identity Not Provided!",
      });
    }
    const token = new twilio.jwt.AccessToken(
      ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_SECRET_KEY,
      { identity }
    );
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: process.env.OUTGOINGAPPLICATION_SID,
    });
    token.addGrant(voiceGrant);

    res.json({
      success: true,
      message: "Token generated successfully",
      token: token.toJwt(),
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate token",
    });
  }
});
app.post("/voice", (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER,
  });

  dial.number(req.body.To);

  res.type("text/xml");
  res.send(response.toString());
});

app.post("/call-status", async (req, res) => {
  const { callSid } = req.body;
  try {
    const call = await client.calls(callSid).fetch();
    res.json({
      success: true,
      message: "Call status fetched successfully",
      data: {
        status: call.status,
        duration: call.duration,
      },
    });
  } catch (error) {
    console.error("Error fetching call status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch call status",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
