import { configDotenv } from "dotenv";
import twilio from "twilio";
import { ErrorHandler } from "../utility/ErrorClass.js";
import { storage, fireStore } from "../config/firebaseconfig.js";
import axios from "axios";
configDotenv();
const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

const voiceController = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE,
    record: "record-from-answer-dual",
    recordingStatusCallback:
      "https://member-service-node.vercel.app/api/call/call-recording",
  });

  dial.number(req.body.To);

  res.type("text/xml");
  res.send(response.toString());
};

const twilioTokenGeneratorController = async (req, res, next) => {
  const { identity } = req.body;
  try {
    if (!identity) {
      return res.status(400).json({
        success: false,
        message: "Identity Not Provided!",
      });
    }
    const token = new twilio.jwt.AccessToken(
      process.env.ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_SECRET_KEY,
      { identity }
    );
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: process.env.OUTGOINGAPPLICATION_SID,
    });
    token.addGrant(voiceGrant);

    return res.status(200).json({
      success: true,
      message: "Token generated successfully",
      token: token.toJwt(),
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
const getCallStatusController = async (req, res, next) => {
  const { callSid } = req.query;
  try {
    const call = await client.calls(callSid).fetch();
    return res.status(200).json({
      success: true,
      message: "Call status fetched successfully",
      data: {
        status: call.status,
      },
    });
  } catch (error) {
    console.error("Error fetching call status:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

const callRecordingController = async (req, res, next) => {
  const recordingUrl = req.body.RecordingUrl + ".wav";
  const recordingSid = req.body.RecordingSid;
  const callSid = req.body.CallSid;
  try {
    const res = await axios({
      method: "get",
      url: recordingUrl,
      responseType: "arraybuffer",
      auth: {
        username: process.env.ACCOUNT_SID,
        password: process.env.AUTH_TOKEN,
      },
    });
    const buffer = Buffer.from(response.data, "binary");
    const file = storage.file(`recordings/${recordingSid}.wav`);
    await file.save(buffer, {
      contentType: "audio/wav",
      metadata: {
        callSid,
        dateTime: new Date().toISOString(),
      },
    });
    await fireStore.collection("calls").add({
      callSid: callSid,
      recordingUrl: `gs://${storage.name}/${file.name}`,
      datetime: new Date().toISOString(),
    });
    return res.status(200).json({
      success: true,
      message: "Call Recorded And Saved Successfully",
    });
  } catch (error) {
    console.log(error);
    return next(
      new ErrorHandler("Error Recording and Storing Call Recording", 500)
    );
  }
};
export {
  getCallStatusController,
  twilioTokenGeneratorController,
  voiceController,
  callRecordingController,
};
